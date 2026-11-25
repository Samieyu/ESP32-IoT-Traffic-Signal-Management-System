# Environment Variables Specification
## Traffic Light System Automation — Wachemo University (SEng4162)

This document details all required and optional environment variables for the backend and frontend services.

> [!WARNING]
> Never commit `.env` files or hardcode real secrets, credentials, or connection strings into version control. Always copy from `.env.example`.

---

### Backend Environment Variables (`backend/.env`)

| Variable Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | String | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | Number | `5000` | Port for the Express REST API and Socket.IO server |
| `API_PREFIX` | String | `/api/v1` | Base route prefix for versioned REST endpoints |
| `CLIENT_URL` | String | `http://localhost:5173` | Allowed frontend origin for CORS policies |
| `DATABASE_URL` | String | Required | PostgreSQL connection string (Neon in production, local Postgres for dev) |
| `JWT_ACCESS_SECRET` | String | Required | Strong random secret key for signing short-lived access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | String | Required | Strong random secret key for signing refresh tokens (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN`| String | `15m` | Lifetime of JWT access token |
| `JWT_REFRESH_EXPIRES_IN`| String | `7d` | Lifetime of refresh token session |
| `ALLOW_INACTIVE_LOGIN` | Boolean | `false` | Security policy toggle: when `false`, deactivated accounts are rejected with 403 Forbidden |
| `RATE_LIMIT_WINDOW_MS` | Number | `900000` | Rate limiting window in milliseconds (15 mins) |
| `RATE_LIMIT_MAX_REQUESTS`| Number | `100` | Maximum requests permitted per IP per rate limit window |
| `MQTT_BROKER_URL` | String | `mqtt://localhost:1883` | MQTT broker endpoint (e.g. `mqtts://broker.hivemq.com:8883` in production) |
| `MQTT_USERNAME` | String | Optional | Device/Backend authentication username for the MQTT broker |
| `MQTT_PASSWORD` | String | Optional | Device/Backend authentication password for the MQTT broker |
| `MQTT_CLIENT_ID` | String | `traffic_backend_service` | Unique client identifier for MQTT connection |
| `MQTT_SIMULATOR_ENABLED` | Boolean | `true` | When true and MQTT broker is offline, activates virtual ESP32 twin for testing/demo |
| `UPLOAD_DIR` | String | `./uploads` | Directory path for storing evidence attachments |
| `MAX_FILE_SIZE_BYTES` | Number | `5242880` | Maximum file attachment size (5MB) |

---

### Frontend Environment Variables (`frontend/.env`)

| Variable Name | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | String | `http://localhost:5000/api/v1` | URL of the backend REST API |
| `VITE_SOCKET_URL` | String | `http://localhost:5000` | URL of the Socket.IO server for real-time events |
| `VITE_APP_NAME` | String | `Traffic Light Automation System`| Control room application title |
| `VITE_INSTITUTION_NAME`| String | `Wachemo University - SEng4162` | Institution & course banner display |
