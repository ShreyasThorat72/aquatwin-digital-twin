# AquaTwin Project Audit & Production Readiness Assessment

**Date:** October 2, 2026  
**Target Architecture:** ESP32 Hardware -> FastAPI Backend on Render (with PostgreSQL) -> WebSockets -> React Frontend on Vercel

---

## 1. Existing Frontend Architecture
- **Framework:** React 18, Vite 5, JavaScript.
- **Routing:** React Router 6 (`BrowserRouter`) with protected routes.
- **State Management:** React Context API (`AuthContext` for user session & authentication, `SCADAContext` for real-time WebSocket telemetry, actuator controls, and system state).
- **Data Visualization:** Chart.js with `react-chartjs-2`, Lucide React icons, animated CSS Digital Twin Water Tank component.
- **Styling:** Custom light industrial SCADA Vanilla CSS design system (`index.css`) with responsive layout.

---

## 2. Existing Backend Architecture
- **Framework:** Python 3.10+, FastAPI, Uvicorn ASGI server.
- **Modular Routers:** 14 API modules under `backend/app/api/` (`auth`, `hardware`, `tank`, `simulation`, `employees`, `shifts`, `scraping`, `csv_console`, `ml`, `analytics`, `alarms`, `reports`, `logs`, `settings`).
- **Async Execution:** Asynchronous background simulation loop running alongside FastAPI lifespan context manager.

---

## 3. Existing Database Architecture
- **Current Database:** SQLite 3 (`aquatwin.db`) via standard Python `sqlite3` library.
- **Tables:** `employees`, `telemetry`, `alarms`, `system_logs`, `settings`, `scraped_data`.
- **Limitation:** Direct SQLite connection functions do not support cloud PostgreSQL instances needed for Render production deployment.

---

## 4. Existing WebSocket Implementation
- **Endpoint:** `/ws/telemetry` managed by `ws_manager.py`.
- **Payloads:** Broadcasts `TELEMETRY_UPDATE` and `INITIAL_SNAPSHOT` JSON objects.
- **Client Side:** React `SCADAContext` manages WebSocket connection with auto-reconnect on disconnect.
- **Limitation:** Currently hardcodes `ws://localhost:8000` fallback instead of dynamically selecting `wss://` when loaded over HTTPS in production.

---

## 5. Existing Telemetry APIs
- `POST /api/hardware/telemetry` - Ingests hardware packets.
- `GET /api/hardware/status` - ESP32 health snapshot.
- `GET /api/hardware/latest` - Returns current telemetry object.
- `GET /api/hardware/history` - Returns array of historical telemetry records.
- `GET /api/hardware/devices` - Returns registered hardware device list.

---

## 6. Existing Simulation System
- **Engine:** `simulation_service.py` implements differential water physics:
  \[ dV/dt = Q_{in} - Q_{out} \]
  \[ V_{new} = V_{old} + (Q_{in} - Q_{out}) \times \Delta t \]
- **Controls:** Start, Pause, Reset, Speed multipliers (1x, 2x, 5x, 10x), Auto/Manual mode.

---

## 7. Existing Machine Learning System
- **Forecasting:** `RandomForestRegressor` trained on lagged telemetry features predicting +10m, +20m, +30m water levels and time to low level (\(\le 20\%\)).
- **Anomaly Detection:** `IsolationForest` statistical outlier detector evaluating water level %, distance, and rate of change.
- **Leak Detection:** Rule + ML hybrid analyzer checking continuous level drop while system is closed.

---

## 8. Existing Alarm System
- **Storage:** `alarms` database table.
- **Triggers:** `LOW_LEVEL`, `HIGH_LEVEL`, `ANOMALY_DETECTED`, `POSSIBLE_LEAK`, `ESP32_OFFLINE`.
- **Endpoints:** `/api/alarms`, `/api/alarms/{id}/acknowledge`, `/api/alarms/acknowledge-all`.

---

## 9. Existing Authentication
- **Security:** Salted SHA-256 password hashing.
- **Session:** Bearer JWT access tokens issued upon login.
- **Seed Users:** `EMP001` (Operator 1), `EMP002` (Operator 2), `EMP003` (Operator 3), `ADMIN001` (Supervisor Admin).

---

## 10. Existing Environment Variables
- Currently relies on defaults in code with basic `VITE_API_BASE_URL`.
- Missing `.env.example` defining `DATABASE_URL`, `PORT`, `SECRET_KEY`, `CORS_ORIGINS`, `VITE_API_URL`.

---

## 11. Components Already Production-Ready
- React UI components, 3D Digital Twin Tank Visualizer, SCADA index.css design system.
- FastAPI router architecture and Pydantic request models.
- Machine Learning algorithms (`RandomForestRegressor`, `IsolationForest`).
- WebSocket connection manager.
- ESP32 firmware core loop (`aquatwin_esp32.ino`).

---

## 12. Components Missing for Real ESP32 Hardware Integration
- Explicit `data_source` tagging ('HARDWARE' vs 'SIMULATION') in telemetry schema.
- Dynamic offline status tracking ('OFFLINE' status broadcast when telemetry packet age exceeds `offline_timeout_seconds`).
- ESP32 configuration template `hardware/esp32/config.example.h`.
- HC-SR04 5V Echo pin voltage divider hardware safety documentation.
- ESP32 telemetry test sender script under `backend/tools/test_esp32_sender.py`.

---

## 13. Components Missing for Render & Vercel Deployment
- **PostgreSQL Database Compatibility:** Abstract database access layer to support both SQLite (local dev) and PostgreSQL (Render production) via `DATABASE_URL`.
- **Render Production Config:** Support `PORT` env var, `0.0.0.0` binding, production CORS for Vercel domain.
- **Vercel Frontend Config:** `vercel.json` SPA rewrite rule so direct browser refreshes on routes like `/tank-monitoring` do not return 404.
- **Dynamic WebSocket URL:** Automatic `ws://` to `wss://` conversion based on `https:` location protocol.
- **Deployment Guides:** `docs/DEPLOYMENT.md` and `docs/ESP32_SETUP.md`.
