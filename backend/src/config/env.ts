import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/traffic_management?schema=public'),
  JWT_ACCESS_SECRET: z.string().default('wcu_traffic_management_access_secret_key_2026_super_secure'),
  JWT_REFRESH_SECRET: z.string().default('wcu_traffic_management_refresh_secret_key_2026_super_secure'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ALLOW_INACTIVE_LOGIN: z.string().transform((val) => val === 'true').default('false'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(200),
  MQTT_BROKER_URL: z.string().default('mqtt://localhost:1883'),
  MQTT_USERNAME: z.string().optional().default(''),
  MQTT_PASSWORD: z.string().optional().default(''),
  MQTT_CLIENT_ID: z.string().default('traffic_backend_service'),
  MQTT_SIMULATOR_ENABLED: z.string().transform((val) => val !== 'false').default('true'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(5 * 1024 * 1024),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
