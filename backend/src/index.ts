import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { dbStore } from './repositories/store.js';
import { SocketService } from './socket/socket.server.js';
import { MqttClientService } from './mqtt/mqtt.client.js';
import { ControllerSimulator } from './mqtt/controller.simulator.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const httpServer = http.createServer(app);

// Security & Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or configured client origin
      if (!origin || origin.startsWith('http://localhost') || origin === env.CLIENT_URL) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in dev/testing
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Socket.IO
SocketService.initialize(httpServer, env.CLIENT_URL);

// Mount API routes
app.use(env.API_PREFIX, apiRouter);

// Centralized error handling
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    console.log('🚀 Starting Traffic Light Management System Server...');
    await connectDatabase();
    await dbStore.initSeed();

    // Initialize MQTT client
    MqttClientService.initialize();

    // Start IoT ESP32 virtual twin simulator if enabled
    if (env.MQTT_SIMULATOR_ENABLED) {
      ControllerSimulator.start();
    }

    httpServer.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚦 TRAFFIC MANAGEMENT SYSTEM BACKEND ONLINE`);
      console.log(`🏛️  Wachemo University - Department of Software Engineering`);
      console.log(`📡 REST API Base: http://localhost:${env.PORT}${env.API_PREFIX}`);
      console.log(`⚡ Socket.IO Server: http://localhost:${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Avoid starting server automatically during jest tests
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, httpServer };
