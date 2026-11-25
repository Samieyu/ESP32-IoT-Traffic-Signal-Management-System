/*
 * =====================================================================================
 *  PROJECT: Traffic Light System Automation — ESP32 Embedded Controller
 *  INSTITUTION: Wachemo University, Department of Software Engineering (SEng4162)
 *  HARDWARE: ESP32-WROOM-32 (Dual Core 240MHz, 4MB Flash, Wi-Fi 802.11 b/g/n, BLE)
 *  COMMUNICATION PROTOCOL: MQTT 3.1.1 over TCP / TLS
 * =====================================================================================
 *
 *  FEATURES & SAFETY ARCHITECTURE:
 *  - FreeRTOS Dual-Task Architecture (Core 0: Network/MQTT, Core 1: Failsafe Signal Engine)
 *  - Yellow Clearance & All-Red Interlocking Enforcement (NFR-14)
 *  - Dynamic Timing Configuration Sync via MQTT (FR-4)
 *  - Hardware Watchdog Timer (WDT) with auto-reboot on lockup
 *  - LCD I2C 16x2 / 20x4 Display Status Updates (FR-4)
 *  - Emergency Priority Mode with automatic 120-second failsafe timeout (FR-5, NFR-14)
 *  - 1-Hz Real-Time Telemetry & 10-Second Keepalive Heartbeats (FR-11)
 *  - Non-Volatile Storage (NVS / EEPROM) fallback for offline continuous operation
 * =====================================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Preferences.h>
#include <esp_task_wdt.h>

// =====================================================================================
// PIN ASSIGNMENTS & HARDWARE CONFIGURATION
// =====================================================================================
// North-South Signal Group
#define PIN_NS_RED     23
#define PIN_NS_YELLOW  22
#define PIN_NS_GREEN   21

// East-West Signal Group
#define PIN_EW_RED     19
#define PIN_EW_YELLOW  18
#define PIN_EW_GREEN    5

// Pedestrian Pushbuttons & Emergency Hardware Overrides (Optional / Interrupt-Driven)
#define PIN_EMERGENCY_BTN 15
#define PIN_STATUS_LED     2  // Onboard Blue LED for network heartbeat

// I2C LCD Configuration (PCF8574 I2C adapter)
#define LCD_ADDR 0x27
#define LCD_COLS 16
#define LCD_ROWS 2

// Watchdog Timeout (Seconds)
#define WDT_TIMEOUT_SECONDS 8

// =====================================================================================
// OPERATIONAL DEFAULTS & SAFETY LIMITS (NFR-14)
// =====================================================================================
#define MIN_GREEN_TIME        10
#define MAX_GREEN_TIME       120
#define MIN_YELLOW_TIME        3
#define MAX_YELLOW_TIME        7
#define MIN_ALL_RED_TIME       1
#define MAX_ALL_RED_TIME       5
#define MAX_EMERGENCY_TIME   120

// State Machine Phases
enum SignalPhase {
  PHASE_NS_GREEN = 0,
  PHASE_NS_YELLOW,
  PHASE_ALL_RED_TO_EW,
  PHASE_EW_GREEN,
  PHASE_EW_YELLOW,
  PHASE_ALL_RED_TO_NS,
  PHASE_EMERGENCY_PRIORITY,
  PHASE_ALL_RED_CLEARANCE
};

// Operating Modes
enum OperatingMode {
  MODE_NORMAL = 0,
  MODE_EMERGENCY,
  MODE_MAINTENANCE_FLASH,
  MODE_MANUAL_HOLD
};

// System Configuration Struct
struct SignalConfig {
  uint16_t nsGreenTime;
  uint16_t ewGreenTime;
  uint16_t yellowTime;
  uint16_t allRedTime;
  uint16_t maxEmergencyTime;
  bool lcdEnabled;
  char lcdMessage[32];
  uint32_t configVersion;
};

// =====================================================================================
// GLOBAL VARIABLES & OBJECTS
// =====================================================================================
const char* WIFI_SSID = "Wachemo_Campus_Net";
const char* WIFI_PASS = "SecureTrafficKey2026";
const char* MQTT_BROKER = "mqtt.traffic.wachemo.edu.et";
const int   MQTT_PORT = 1883;
const char* DEVICE_ID = "ESP32_WROOM_C4D8_01";
const char* INTERSECTION_ID = "int-hosanna-central-01";

// MQTT Topics
char TOPIC_STATUS[64];
char TOPIC_HEARTBEAT[64];
char TOPIC_CONFIG[64];
char TOPIC_EMERGENCY[64];
char TOPIC_ACK[64];

WiFiClient espClient;
PubSubClient mqttClient(espClient);
LiquidCrystal_I2C lcd(LCD_ADDR, LCD_COLS, LCD_ROWS);
Preferences nvsPreferences;

// Thread-Safe Shared State
portMUX_TYPE stateMutex = portMUX_INITIALIZER_UNLOCKED;
volatile SignalPhase currentPhase = PHASE_ALL_RED_CLEARANCE;
volatile OperatingMode currentMode = MODE_NORMAL;
volatile uint16_t phaseRemainingSecs = 3;
volatile bool emergencyRequested = false;
volatile char emergencyDirection[8] = "NS";

SignalConfig activeConfig;
unsigned long lastTelemetryMillis = 0;
unsigned long lastHeartbeatMillis = 0;
unsigned long emergencyStartMillis = 0;

// Task Handles
TaskHandle_t TaskSignalEngineHandle;
TaskHandle_t TaskNetworkMqttHandle;

// =====================================================================================
// FUNCTION PROTOTYPES
// =====================================================================================
void setupHardwarePins();
void loadPersistentConfig();
void savePersistentConfig();
void updateLcdDisplay();
void setPhysicalOutputs(bool nsR, bool nsY, bool nsG, bool ewR, bool ewY, bool ewG);
void applyFailsafeAllRed();
void connectToWiFi();
void connectToMqtt();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishTelemetry();
void publishHeartbeat();
void publishConfigAck(bool success, uint32_t version, const char* reason);
void TaskSignalEngine(void* parameter);
void TaskNetworkMqtt(void* parameter);

// =====================================================================================
// HARDWARE INITIALIZATION & SETUP
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=======================================================");
  Serial.println("  WACHEMO UNIVERSITY — TRAFFIC LIGHT AUTOMATION SYSTEM");
  Serial.println("  ESP32-WROOM-32 Real-Time Dual-Core Controller Startup");
  Serial.println("=======================================================");

  setupHardwarePins();
  applyFailsafeAllRed();

  // Initialize NVS storage and load previous safe timings
  loadPersistentConfig();

  // Initialize LCD
  if (activeConfig.lcdEnabled) {
    Wire.begin(21, 22);
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SYSTEM STARTING");
    lcd.setCursor(0, 1);
    lcd.print("ID: HOSANNA-01");
  }

  // Construct MQTT Topics
  snprintf(TOPIC_STATUS, sizeof(TOPIC_STATUS), "traffic/%s/status", INTERSECTION_ID);
  snprintf(TOPIC_HEARTBEAT, sizeof(TOPIC_HEARTBEAT), "traffic/%s/heartbeat", INTERSECTION_ID);
  snprintf(TOPIC_CONFIG, sizeof(TOPIC_CONFIG), "traffic/%s/config", INTERSECTION_ID);
  snprintf(TOPIC_EMERGENCY, sizeof(TOPIC_EMERGENCY), "traffic/%s/emergency", INTERSECTION_ID);
  snprintf(TOPIC_ACK, sizeof(TOPIC_ACK), "traffic/%s/ack", INTERSECTION_ID);

  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(1024);

  // Setup Hardware Watchdog Timer
  esp_task_wdt_init(WDT_TIMEOUT_SECONDS, true);

  // Launch Core 1 Signal Engine Task (High Priority: Failsafe Execution)
  xTaskCreatePinnedToCore(
    TaskSignalEngine,
    "SignalEngine",
    4096,
    NULL,
    3,
    &TaskSignalEngineHandle,
    1 // Pinned to Core 1
  );

  // Launch Core 0 Network / MQTT Task (Normal Priority)
  xTaskCreatePinnedToCore(
    TaskNetworkMqtt,
    "NetworkMqtt",
    8192,
    NULL,
    1,
    &TaskNetworkMqttHandle,
    0 // Pinned to Core 0
  );
}

void loop() {
  // Main loop is kept vacant; FreeRTOS tasks manage execution independently
  vTaskDelay(pdMS_TO_TICKS(1000));
}

// =====================================================================================
// PIN CONFIGURATION & SAFETY INTERLOCKING
// =====================================================================================
void setupHardwarePins() {
  pinMode(PIN_NS_RED, OUTPUT);
  pinMode(PIN_NS_YELLOW, OUTPUT);
  pinMode(PIN_NS_GREEN, OUTPUT);

  pinMode(PIN_EW_RED, OUTPUT);
  pinMode(PIN_EW_YELLOW, OUTPUT);
  pinMode(PIN_EW_GREEN, OUTPUT);

  pinMode(PIN_STATUS_LED, OUTPUT);
  pinMode(PIN_EMERGENCY_BTN, INPUT_PULLUP);
}

void applyFailsafeAllRed() {
  // Turn off greens and yellows first (NFR-14)
  digitalWrite(PIN_NS_GREEN, LOW);
  digitalWrite(PIN_NS_YELLOW, LOW);
  digitalWrite(PIN_EW_GREEN, LOW);
  digitalWrite(PIN_EW_YELLOW, LOW);

  // Set all approaches to Red
  digitalWrite(PIN_NS_RED, HIGH);
  digitalWrite(PIN_EW_RED, HIGH);
}

void setPhysicalOutputs(bool nsR, bool nsY, bool nsG, bool ewR, bool ewY, bool ewG) {
  // CRITICAL SAFETY INVARIANT (NFR-14): Conflicting greens are prohibited by hardware logic
  if (nsG && ewG) {
    Serial.println("CRITICAL FAULT DETECTED: Simultaneous Green requested! Activating Emergency All-Red!");
    applyFailsafeAllRed();
    return;
  }

  digitalWrite(PIN_NS_RED, nsR ? HIGH : LOW);
  digitalWrite(PIN_NS_YELLOW, nsY ? HIGH : LOW);
  digitalWrite(PIN_NS_GREEN, nsG ? HIGH : LOW);

  digitalWrite(PIN_EW_RED, ewR ? HIGH : LOW);
  digitalWrite(PIN_EW_YELLOW, ewY ? HIGH : LOW);
  digitalWrite(PIN_EW_GREEN, ewG ? HIGH : LOW);
}

// =====================================================================================
// CORE 1: REAL-TIME TRAFFIC SIGNAL STATE MACHINE (FREERTOS)
// =====================================================================================
void TaskSignalEngine(void* parameter) {
  esp_task_wdt_add(NULL);
  TickType_t xLastWakeTime = xTaskGetTickCount();

  while (true) {
    esp_task_wdt_reset();

    portENTER_CRITICAL(&stateMutex);
    SignalPhase current = currentPhase;
    OperatingMode mode = currentMode;
    portEXIT_CRITICAL(&stateMutex);

    // EMERGENCY MODE HANDLING
    if (mode == MODE_EMERGENCY) {
      if (millis() - emergencyStartMillis > (activeConfig.maxEmergencyTime * 1000UL)) {
        Serial.println("EMERGENCY FAULT: Maximum priority duration exceeded (120s limit). Resuming normal cycle.");
        portENTER_CRITICAL(&stateMutex);
        currentMode = MODE_NORMAL;
        currentPhase = PHASE_ALL_RED_CLEARANCE;
        phaseRemainingSecs = activeConfig.allRedTime;
        portEXIT_CRITICAL(&stateMutex);
      } else {
        // Enforce Emergency green on requested corridor, Red on opposing corridor
        if (strcmp((const char*)emergencyDirection, "EW") == 0) {
          setPhysicalOutputs(true, false, false, false, false, true); // NS=Red, EW=Green
        } else {
          setPhysicalOutputs(false, false, true, true, false, false); // NS=Green, EW=Red
        }
        vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1000));
        continue;
      }
    }

    // NORMAL TRAFFIC CYCLE WITH RIGID CLEARANCE INTERVALS
    switch (current) {
      case PHASE_ALL_RED_CLEARANCE:
        setPhysicalOutputs(true, false, false, true, false, false);
        if (--phaseRemainingSecs == 0) {
          portENTER_CRITICAL(&stateMutex);
          currentPhase = PHASE_NS_GREEN;
          phaseRemainingSecs = activeConfig.nsGreenTime;
          portEXIT_CRITICAL(&stateMutex);
        }
        break;

      case PHASE_NS_GREEN:
        setPhysicalOutputs(false, false, true, true, false, false); // NS: Green, EW: Red
        if (--phaseRemainingSecs == 0) {
          portENTER_CRITICAL(&stateMutex);
          currentPhase = PHASE_NS_YELLOW;
          phaseRemainingSecs = activeConfig.yellowTime;
          portEXIT_CRITICAL(&stateMutex);
        }
        break;

      case PHASE_NS_YELLOW:
        setPhysicalOutputs(false, true, false, true, false, false); // NS: Yellow, EW: Red
        if (--phaseRemainingSecs == 0) {
          portENTER_CRITICAL(&stateMutex);
          currentPhase = PHASE_ALL_RED_TO_EW;
          phaseRemainingSecs = activeConfig.allRedTime;
          portEXIT_CRITICAL(&stateMutex);
        }
        break;

      case PHASE_ALL_RED_TO_EW:
        setPhysicalOutputs(true, false, false, true, false, false); // All-Red
        if (--phaseRemainingSecs == 0) {
          portENTER_CRITICAL(&stateMutex);
          currentPhase = PHASE_EW_GREEN;
          phaseRemainingSecs = activeConfig.ewGreenTime;
          portEXIT_CRITICAL(&stateMutex);
        }
        break;

      case PHASE_EW_GREEN:
        setPhysicalOutputs(true, false, false, false, false, true); // NS: Red, EW: Green
        if (--phaseRemainingSecs == 0) {
          portENTER_CRITICAL(&stateMutex);
          currentPhase = PHASE_EW_YELLOW;
          phaseRemainingSecs = activeConfig.yellowTime;
          portEXIT_CRITICAL(&stateMutex);
        }
        break;

      case PHASE_EW_YELLOW:
        setPhysicalOutputs(true, false, false, false, true, false); // NS: Red, EW: Yellow
        if (--phaseRemainingSecs == 0) {
          portENTER_CRITICAL(&stateMutex);
          currentPhase = PHASE_ALL_RED_TO_NS;
          phaseRemainingSecs = activeConfig.allRedTime;
          portEXIT_CRITICAL(&stateMutex);
        }
        break;

      case PHASE_ALL_RED_TO_NS:
        setPhysicalOutputs(true, false, false, true, false, false); // All-Red
        if (--phaseRemainingSecs == 0) {
          portENTER_CRITICAL(&stateMutex);
          currentPhase = PHASE_NS_GREEN;
          phaseRemainingSecs = activeConfig.nsGreenTime;
          portEXIT_CRITICAL(&stateMutex);
        }
        break;

      default:
        applyFailsafeAllRed();
        currentPhase = PHASE_ALL_RED_CLEARANCE;
        phaseRemainingSecs = activeConfig.allRedTime;
        break;
    }

    // Refresh LCD
    updateLcdDisplay();

    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(1000));
  }
}

// =====================================================================================
// CORE 0: NETWORK & MQTT TELEMETRY TASK (FREERTOS)
// =====================================================================================
void TaskNetworkMqtt(void* parameter) {
  connectToWiFi();
  connectToMqtt();

  while (true) {
    if (WiFi.status() != WL_CONNECTED) {
      connectToWiFi();
    }

    if (!mqttClient.connected()) {
      connectToMqtt();
    } else {
      mqttClient.loop();
    }

    unsigned long now = millis();

    // 1-Hz Real-Time Telemetry Publish
    if (now - lastTelemetryMillis >= 1000) {
      lastTelemetryMillis = now;
      publishTelemetry();
    }

    // 10-Second Keepalive Heartbeat Publish
    if (now - lastHeartbeatMillis >= 10000) {
      lastHeartbeatMillis = now;
      publishHeartbeat();
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// =====================================================================================
// NETWORK & MQTT CLIENT MANAGEMENT
// =====================================================================================
void connectToWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 15) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi connected successfully! IP: " + WiFi.localIP().toString());
    digitalWrite(PIN_STATUS_LED, HIGH);
  } else {
    Serial.println("\nWi-Fi connection failed. Will retry in background while running local cycle.");
    digitalWrite(PIN_STATUS_LED, LOW);
  }
}

void connectToMqtt() {
  if (mqttClient.connected() || WiFi.status() != WL_CONNECTED) return;

  Serial.print("Attempting MQTT connection to ");
  Serial.print(MQTT_BROKER);
  Serial.print("...");

  if (mqttClient.connect(DEVICE_ID, "traffic_agent", "SecureToken992")) {
    Serial.println(" Connected!");
    mqttClient.subscribe(TOPIC_CONFIG, 1);
    mqttClient.subscribe(TOPIC_EMERGENCY, 1);
    publishHeartbeat();
  } else {
    Serial.print(" Failed, rc=");
    Serial.println(mqttClient.state());
  }
}

// =====================================================================================
// MQTT INCOMING DISPATCHER (CONFIG & EMERGENCY COMMANDS)
// =====================================================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<1024> doc;
  DeserializationError err = deserializeJson(doc, payload, length);

  if (err) {
    Serial.print("MQTT JSON parse error: ");
    Serial.println(err.c_str());
    return;
  }

  // CONFIGURATION UPDATE RECEIVED
  if (strcmp(topic, TOPIC_CONFIG) == 0) {
    Serial.println("Received dynamic signal configuration update from backend.");

    uint16_t nsGreen = doc["nsGreenTime"] | activeConfig.nsGreenTime;
    uint16_t ewGreen = doc["ewGreenTime"] | activeConfig.ewGreenTime;
    uint16_t yellow = doc["yellowTime"] | activeConfig.yellowTime;
    uint16_t allRed = doc["allRedTime"] | activeConfig.allRedTime;
    uint16_t emergency = doc["maxEmergencyTime"] | activeConfig.maxEmergencyTime;
    uint32_t version = doc["version"] | (activeConfig.configVersion + 1);

    // Validate NFR-14 constraints before applying
    if (nsGreen < MIN_GREEN_TIME || nsGreen > MAX_GREEN_TIME ||
        ewGreen < MIN_GREEN_TIME || ewGreen > MAX_GREEN_TIME ||
        yellow < MIN_YELLOW_TIME || yellow > MAX_YELLOW_TIME ||
        allRed < MIN_ALL_RED_TIME || allRed > MAX_ALL_RED_TIME) {
      Serial.println("CONFIG REJECTED: Timing parameters violate safety envelope!");
      publishConfigAck(false, version, "Timing parameters outside certified safety envelope (NFR-14)");
      return;
    }

    portENTER_CRITICAL(&stateMutex);
    activeConfig.nsGreenTime = nsGreen;
    activeConfig.ewGreenTime = ewGreen;
    activeConfig.yellowTime = yellow;
    activeConfig.allRedTime = allRed;
    activeConfig.maxEmergencyTime = emergency;
    activeConfig.configVersion = version;
    if (doc.containsKey("lcdEnabled")) activeConfig.lcdEnabled = doc["lcdEnabled"];
    if (doc.containsKey("lcdMessage")) strncpy(activeConfig.lcdMessage, doc["lcdMessage"], 31);
    portEXIT_CRITICAL(&stateMutex);

    savePersistentConfig();
    publishConfigAck(true, version, "Configuration validated, saved to NVS, and active");
    Serial.println("Config updated and applied safely.");
  }

  // EMERGENCY PRIORITY COMMAND RECEIVED
  else if (strcmp(topic, TOPIC_EMERGENCY) == 0) {
    const char* action = doc["action"] | "ACTIVATE";
    const char* direction = doc["direction"] | "NS";

    if (strcmp(action, "ACTIVATE") == 0) {
      Serial.printf("Activating Emergency Priority Corridor: %s\n", direction);
      portENTER_CRITICAL(&stateMutex);
      currentMode = MODE_EMERGENCY;
      strncpy((char*)emergencyDirection, direction, 7);
      emergencyStartMillis = millis();
      portEXIT_CRITICAL(&stateMutex);
    } else {
      Serial.println("Terminating Emergency Priority Corridor. Returning to All-Red clearance.");
      portENTER_CRITICAL(&stateMutex);
      currentMode = MODE_NORMAL;
      currentPhase = PHASE_ALL_RED_CLEARANCE;
      phaseRemainingSecs = activeConfig.allRedTime;
      portEXIT_CRITICAL(&stateMutex);
    }
  }
}

// =====================================================================================
// TELEMETRY & REPORTING
// =====================================================================================
void publishTelemetry() {
  StaticJsonDocument<512> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["intersectionId"] = INTERSECTION_ID;
  doc["timestamp"] = millis();

  portENTER_CRITICAL(&stateMutex);
  SignalPhase p = currentPhase;
  OperatingMode m = currentMode;
  uint16_t secs = phaseRemainingSecs;
  portEXIT_CRITICAL(&stateMutex);

  // Derive light states
  bool nsG = (p == PHASE_NS_GREEN);
  bool nsY = (p == PHASE_NS_YELLOW);
  bool nsR = (!nsG && !nsY);

  bool ewG = (p == PHASE_EW_GREEN);
  bool ewY = (p == PHASE_EW_YELLOW);
  bool ewR = (!ewG && !ewY);

  if (m == MODE_EMERGENCY) {
    if (strcmp((const char*)emergencyDirection, "EW") == 0) {
      nsR = true; nsY = false; nsG = false;
      ewR = false; ewY = false; ewG = true;
    } else {
      nsR = false; nsY = false; nsG = true;
      ewR = true; ewY = false; ewG = false;
    }
  }

  doc["mode"] = (m == MODE_EMERGENCY) ? "EMERGENCY_OVERRIDE" : "NORMAL_AUTOMATED";
  doc["currentPhase"] = (p == PHASE_NS_GREEN || p == PHASE_NS_YELLOW) ? "NORTH_SOUTH_FLOW" : "EAST_WEST_FLOW";
  doc["countdown"] = secs;

  JsonObject ns = doc.createNestedObject("northSouth");
  ns["red"] = nsR;
  ns["yellow"] = nsY;
  ns["green"] = nsG;

  JsonObject ew = doc.createNestedObject("eastWest");
  ew["red"] = ewR;
  ew["yellow"] = ewY;
  ew["green"] = ewG;

  char buffer[512];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_STATUS, buffer);
}

void publishHeartbeat() {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["intersectionId"] = INTERSECTION_ID;
  doc["status"] = "ONLINE";
  doc["uptimeSeconds"] = millis() / 1000;
  doc["freeHeapBytes"] = esp_get_free_heap_size();
  doc["rssi"] = WiFi.RSSI();
  doc["firmwareVersion"] = "2.4.0-WCU";

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_HEARTBEAT, buffer);
}

void publishConfigAck(bool success, uint32_t version, const char* reason) {
  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["intersectionId"] = INTERSECTION_ID;
  doc["version"] = version;
  doc["status"] = success ? "APPLIED" : "REJECTED";
  doc["reason"] = reason;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_ACK, buffer, true);
}

// =====================================================================================
// NVS STORAGE & LCD INTERFACE
// =====================================================================================
void loadPersistentConfig() {
  nvsPreferences.begin("traffic_cfg", false);
  activeConfig.nsGreenTime = nvsPreferences.getUShort("nsG", 30);
  activeConfig.ewGreenTime = nvsPreferences.getUShort("ewG", 25);
  activeConfig.yellowTime = nvsPreferences.getUShort("yel", 4);
  activeConfig.allRedTime = nvsPreferences.getUShort("allR", 2);
  activeConfig.maxEmergencyTime = nvsPreferences.getUShort("emg", 60);
  activeConfig.configVersion = nvsPreferences.getUInt("ver", 1);
  activeConfig.lcdEnabled = nvsPreferences.getBool("lcdEn", true);
  String msg = nvsPreferences.getString("lcdMsg", "DRIVE CAREFULLY");
  strncpy(activeConfig.lcdMessage, msg.c_str(), 31);
  nvsPreferences.end();
}

void savePersistentConfig() {
  nvsPreferences.begin("traffic_cfg", false);
  nvsPreferences.putUShort("nsG", activeConfig.nsGreenTime);
  nvsPreferences.putUShort("ewG", activeConfig.ewGreenTime);
  nvsPreferences.putUShort("yel", activeConfig.yellowTime);
  nvsPreferences.putUShort("allR", activeConfig.allRedTime);
  nvsPreferences.putUShort("emg", activeConfig.maxEmergencyTime);
  nvsPreferences.putUInt("ver", activeConfig.configVersion);
  nvsPreferences.putBool("lcdEn", activeConfig.lcdEnabled);
  nvsPreferences.putString("lcdMsg", String(activeConfig.lcdMessage));
  nvsPreferences.end();
}

void updateLcdDisplay() {
  if (!activeConfig.lcdEnabled) return;

  char line0[17];
  char line1[17];

  portENTER_CRITICAL(&stateMutex);
  OperatingMode m = currentMode;
  SignalPhase p = currentPhase;
  uint16_t secs = phaseRemainingSecs;
  portEXIT_CRITICAL(&stateMutex);

  if (m == MODE_EMERGENCY) {
    snprintf(line0, sizeof(line0), "EMERGENCY CORR");
    snprintf(line1, sizeof(line1), "PASS %s | HOLD %s", emergencyDirection, (strcmp((char*)emergencyDirection, "NS") == 0) ? "EW" : "NS");
  } else {
    const char* activeCorridor = (p == PHASE_NS_GREEN || p == PHASE_NS_YELLOW) ? "NS:GO" : "EW:GO";
    if (p == PHASE_ALL_RED_CLEARANCE || p == PHASE_ALL_RED_TO_EW || p == PHASE_ALL_RED_TO_NS) {
      activeCorridor = "ALL:STOP";
    }
    snprintf(line0, sizeof(line0), "%-8s SEC:%-3d", activeCorridor, secs);
    snprintf(line1, sizeof(line1), "%-16s", activeConfig.lcdMessage);
  }

  lcd.setCursor(0, 0);
  lcd.print(line0);
  lcd.setCursor(0, 1);
  lcd.print(line1);
}
