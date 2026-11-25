# 📡 ESP32 Hardware & MQTT Integration Manual
> **Traffic Light System Automation — Wachemo University (SEng4162: Real Time & Embedded Systems)**  
> *Hardware Specification, FreeRTOS Architecture, Pinout Schematics, and MQTT Protocols*

---

## 📌 1. Embedded Hardware Architecture

The physical traffic intersection controller is powered by the **ESP32-WROOM-32** dual-core 32-bit Xtensa microcontroller operating at 240 MHz.

```
                                  +-----------------------+
                                  |     ESP32-WROOM-32    |
                                  |  Dual Core @ 240MHz   |
                                  +-----------+-----------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
       [CORE 1: SIGNAL ENGINE]                               [CORE 0: NETWORK & TELEMETRY]
       - Real-Time FreeRTOS Task (Priority 3)                - Real-Time FreeRTOS Task (Priority 1)
       - Rigid Yellow & All-Red Clearance Timer              - Wi-Fi 802.11 b/g/n Station Management
       - Physical Relay/Transistor GPIO Driving               - MQTT v3.1.1 Client (PubSubClient)
       - Dual-Green Hardware Interlock Protection            - 1-Hz Real-Time JSON Telemetry Publish
       - 120s Emergency Safety Timeout Watchdog              - Dynamic Config Sync & NVS Flash Storage
       - LiquidCrystal I2C 16x2 / 20x4 Driver                - 10s Keepalive Heartbeat Broadcast
```

---

## 🔌 2. ESP32 Pinout & Wiring Specification

### A. Traffic Signal GPIO Output Mapping
| Signal Group | Light Color | ESP32 GPIO | Logic Level | Drive Circuit |
| :--- | :--- | :--- | :--- | :--- |
| **North-South Approach** | 🔴 Red | `GPIO 23` | Active HIGH (`3.3V`) | 2N2222 NPN Transistor / 5V Relay Coil |
| **North-South Approach** | 🟡 Yellow | `GPIO 22` | Active HIGH (`3.3V`) | 2N2222 NPN Transistor / 5V Relay Coil |
| **North-South Approach** | 🟢 Green | `GPIO 21` | Active HIGH (`3.3V`) | 2N2222 NPN Transistor / 5V Relay Coil |
| **East-West Approach** | 🔴 Red | `GPIO 19` | Active HIGH (`3.3V`) | 2N2222 NPN Transistor / 5V Relay Coil |
| **East-West Approach** | 🟡 Yellow | `GPIO 18` | Active HIGH (`3.3V`) | 2N2222 NPN Transistor / 5V Relay Coil |
| **East-West Approach** | 🟢 Green | `GPIO 5`  | Active HIGH (`3.3V`) | 2N2222 NPN Transistor / 5V Relay Coil |

### B. Peripherals & Auxiliary Interfaces
| Peripheral | Pin / Line | ESP32 GPIO | Description |
| :--- | :--- | :--- | :--- |
| **I2C LCD (16x2 / 20x4)** | SDA | `GPIO 21` (or Wire 1 `GPIO 32`) | I2C Data line via PCF8574 backpack (`0x27`) |
| **I2C LCD (16x2 / 20x4)** | SCL | `GPIO 22` (or Wire 1 `GPIO 33`) | I2C Clock line |
| **Emergency Pushbutton** | INPUT | `GPIO 15` | External interrupt line with pullup resistor |
| **Status / Heartbeat LED** | OUTPUT | `GPIO 2` | Onboard blue LED blinks on MQTT transmission |

### C. Power Supply Requirements
- **Regulated Supply**: 5.0 V DC (Minimum 2.0 A current rating to handle Wi-Fi burst transmissions and relay latching).
- **Decoupling**: 1000 µF electrolytic capacitor across the 5V and GND rail; 100 nF ceramic capacitor directly across ESP32 VDD and GND pins.
- **Common Ground**: All relay boards, driver transistors, and logic GND must be physically bonded.

---

## 📡 3. MQTT Protocol & Topic Topology

The controller communicates with the centralized Node.js backend using an MQTT broker (e.g. Mosquitto, HiveMQ, or EMQX).

```
traffic/
  └── {intersectionId}/
        ├── status        (ESP32 -> Backend: 1-Hz Real-Time Telemetry)
        ├── heartbeat     (ESP32 -> Backend: 10-Second Keepalive)
        ├── config        (Backend -> ESP32: Dynamic Timing Configurations)
        ├── ack           (ESP32 -> Backend: Configuration Delivery Confirmation)
        └── emergency     (Backend -> ESP32: Priority Corridor Overrides)
```

---

### A. Real-Time Telemetry Payload (`traffic/{id}/status`)
- **Direction**: Controller ➔ Backend
- **Interval**: 1 Second (1 Hz)
- **QoS**: 0 (Low latency real-time stream)
- **JSON Structure**:
```json
{
  "deviceId": "ESP32_WROOM_C4D8_01",
  "intersectionId": "int-hosanna-01",
  "timestamp": 1774512900000,
  "mode": "NORMAL_AUTOMATED",
  "currentPhase": "NORTH_SOUTH_FLOW",
  "countdown": 24,
  "northSouth": {
    "red": false,
    "yellow": false,
    "green": true
  },
  "eastWest": {
    "red": true,
    "yellow": false,
    "green": false
  }
}
```

---

### B. Controller Keepalive Heartbeat (`traffic/{id}/heartbeat`)
- **Direction**: Controller ➔ Backend
- **Interval**: 10 Seconds
- **QoS**: 1
- **JSON Structure**:
```json
{
  "deviceId": "ESP32_WROOM_C4D8_01",
  "intersectionId": "int-hosanna-01",
  "status": "ONLINE",
  "uptimeSeconds": 86420,
  "freeHeapBytes": 194820,
  "rssi": -58,
  "firmwareVersion": "2.4.0-WCU"
}
```

---

### C. Configuration Update Command (`traffic/{id}/config`)
- **Direction**: Backend ➔ Controller
- **Trigger**: Administrator updates signal parameters in Web UI (`FR-4`)
- **QoS**: 1
- **JSON Structure**:
```json
{
  "intersectionId": "int-hosanna-01",
  "version": 4,
  "nsGreenTime": 35,
  "ewGreenTime": 25,
  "yellowTime": 4,
  "allRedTime": 2,
  "maxEmergencyTime": 90,
  "lcdEnabled": true,
  "lcdMessage": "DRIVE SAFELY WCU"
}
```

---

### D. Configuration Acknowledgment (`traffic/{id}/ack`)
- **Direction**: Controller ➔ Backend
- **Trigger**: Immediately upon receiving and validating configuration
- **QoS**: 1 (Retained)
- **JSON Structure**:
```json
{
  "deviceId": "ESP32_WROOM_C4D8_01",
  "intersectionId": "int-hosanna-01",
  "version": 4,
  "status": "APPLIED",
  "reason": "Configuration validated, saved to NVS, and active",
  "timestamp": 1774512920000
}
```

---

### E. Emergency Priority Command (`traffic/{id}/emergency`)
- **Direction**: Backend ➔ Controller
- **Trigger**: Traffic Police activates green corridor (`FR-5`)
- **QoS**: 1
- **JSON Structure**:
```json
{
  "intersectionId": "int-hosanna-01",
  "action": "ACTIVATE",
  "direction": "NS",
  "maxDurationSeconds": 120
}
```

---

## 🛡 4. FreeRTOS Safety Guardrails & Invariants (NFR-14)

1. **Dual-Green Prevention**:
   The `setPhysicalOutputs` routine performs a hardware check before writing GPIO states:
   ```cpp
   if (nsG && ewG) {
       applyFailsafeAllRed();
       return;
   }
   ```
2. **Clearance Enclosure**: Opposing approaches can NEVER illuminate green without traversing mandatory Yellow (3–7s) and All-Red (1–5s) phases.
3. **Emergency Auto-Timeout**: If emergency priority runs longer than `activeConfig.maxEmergencyTime` (hard-capped at 120 seconds), Core 1 overrides the command and drops back into All-Red clearance.
4. **Non-Volatile Storage (NVS)**: All timing parameters and the last verified config version are persisted in ESP32 Flash memory via the `Preferences` library. If power is interrupted, the controller resumes autonomous operation with safe timings even before network connection is restored.
5. **Watchdog Protection**: An 8-second hardware watchdog (`esp_task_wdt`) monitors Core 1. If any deadlock occurs, the ESP32 automatically reboots and defaults to All-Red clearance.

---

## 🔨 5. Flashing Firmware to ESP32

### Via Arduino IDE:
1. Install **ESP32 Board Support**: Add `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json` to Additional Board Manager URLs.
2. Install Required Libraries via Library Manager:
   - `PubSubClient` (Nick O'Leary)
   - `ArduinoJson` (v6.x or v7.x by Benoît Blanchon)
   - `LiquidCrystal_I2C` (Marco Schwartz)
3. Open `firmware/esp32_traffic_controller.ino`.
4. Select Board: **ESP32 Dev Module**.
5. Connect ESP32 via Micro-USB, select the COM port, and click **Upload**.

---
*Maintained by Wachemo University Department of Software Engineering.*
