# AquaTwin: Smart Water Tank Digital Twin & Industrial SCADA Platform

AquaTwin is an industrial SCADA platform and Digital Twin system that integrates physical IoT hardware (ESP32 + HC-SR04 Ultrasonic Water Level Sensor), FastAPI WebSocket real-time backend, SQLite persistence, React UI, Machine Learning (RandomForestRegressor forecasting and IsolationForest anomaly detection), automated leak detection, and employee/shift management.

---

## 1. System Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
| PHYSICAL LAYER                                                                    |
| Real Physical Water Level  -->  HC-SR04 Ultrasonic Sensor  -->  ESP32 (Wi-Fi)     |
+----------------------------------------+------------------------------------------+
                                         | HTTP POST JSON
                                         v
+-----------------------------------------------------------------------------------+
| BACKEND SERVICES (FastAPI @ Port 8000)                                            |
| 1. Validation & Physics Bounds Check                                              |
| 2. Anomaly Detection (IsolationForest) & Leak Detection                           |
| 3. SQLite Database Persistence (aquatwin.db)                                      |
| 4. Real-Time Broadcast Manager (WebSocket /ws/telemetry)                          |
+----------------------------------------+------------------------------------------+
                                         | WebSocket JSON Stream
                                         v
+-----------------------------------------------------------------------------------+
| FRONTEND & DIGITAL TWIN (React + Vite @ Port 5173)                                |
| 1. 3D Animated SCADA Tank Visualizer (filling/emptying physics)                   |
| 2. Real-Time Telemetry Line Charts & Gauge Cards                                  |
| 3. Multi-Horizon ML Level Forecasting (+10m, +20m, +30m)                          |
| 4. Operator & Shift Control Console                                               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, JavaScript, React Router 6, CSS Design System, Chart.js, Lucide Icons
- **Backend**: Python 3.10+, FastAPI, Uvicorn, WebSockets, Pydantic, Python-JOSE (JWT)
- **Database**: SQLite 3 (Thread-safe connection pool & seed engine)
- **Data Science & ML**: Pandas, NumPy, Scikit-learn (`RandomForestRegressor`, `IsolationForest`), Joblib
- **Web Scraping**: Requests, BeautifulSoup4, Pandas
- **Microcontroller Firmware**: ESP32 C++ Arduino Framework (`aquatwin_esp32.ino`, `config.h`)

---

## 3. Directory Structure

```
AquaTwin/
├── frontend/
│   ├── src/
│   │   ├── components/       # TankVisualization, TopBar, Sidebar
│   │   ├── pages/            # 16 Industrial SCADA Views & Control Pages
│   │   ├── layouts/          # MainLayout
│   │   ├── services/         # API & WebSocket Client
│   │   ├── context/          # AuthContext & SCADAContext
│   │   ├── App.jsx           # React Router
│   │   ├── main.jsx
│   │   └── index.css         # Industrial SCADA Design System
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── api/              # 14 Modular FastAPI REST Routers
│   │   ├── database/         # SQLite schema & seeding
│   │   ├── ml/               # Forecaster, AnomalyDetector, LeakDetector
│   │   ├── services/         # Telemetry & Simulation Engine
│   │   ├── websocket/        # Connection Manager
│   │   └── main.py           # FastAPI entrypoint
│   └── requirements.txt
├── hardware/
│   └── esp32/
│       ├── aquatwin_esp32.ino
│       ├── config.h
│       └── README.md         # Circuit wiring & voltage divider guide
├── hardware_test_simulator.py # ESP32 Hardware Emulator
├── data/
│   ├── telemetry/            # CSV telemetry exports
│   ├── employees/            # Employee master CSV
│   ├── scraped/              # External weather/water scraped CSVs
│   └── reports/              # Audit report JSON exports
├── ml_models/                # Saved scikit-learn model pickles (.pkl)
├── run_system.py             # One-click system launcher
└── README.md
```

---

## 4. How to Run the System

### Quick Start (All-in-One Launcher)
Run the root launcher script:
```bash
python run_system.py
```

Or start backend and frontend individually:

#### Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Access the Web Application at: **`http://localhost:5173`**
Default Operator Credentials:
- **Employee ID:** `EMP001` | **Password:** `pass123`
- **Admin ID:** `ADMIN001` | **Password:** `admin123`

---

## 5. Hardware Setup & ESP32 Configuration

### Circuit Wiring & Safety

> [!WARNING]
> The HC-SR04 Ultrasonic Sensor outputs **5V** logic on its Echo pin.
> The ESP32 GPIO pins tolerate a maximum of **3.3V**.
> A voltage divider (1kΩ and 2kΩ resistors) **must** be placed between the HC-SR04 Echo pin and ESP32 GPIO 18.

- **HC-SR04 VCC** -> ESP32 5V / VIN
- **HC-SR04 GND** -> ESP32 GND
- **HC-SR04 Trigger** -> ESP32 GPIO 5
- **HC-SR04 Echo** -> [1kΩ Resistor] -> ESP32 GPIO 18 -> [2kΩ Resistor] -> GND

### ESP32 Firmware Upload
1. Edit `hardware/esp32/config.h` with your Wi-Fi SSID, Wi-Fi Password, and computer's LAN IP (`http://192.168.1.X:8000/api/hardware/telemetry`).
2. Open `hardware/esp32/aquatwin_esp32.ino` in Arduino IDE.
3. Select Board **ESP32 Dev Module**, choose your COM port, and click **Upload**.

---

## 6. Testing Without Hardware (Hardware Test Simulator)

If physical ESP32 hardware is not yet connected:
```bash
python hardware_test_simulator.py
```
This script emulates an ESP32 sending real JSON telemetry packets to FastAPI every second, testing the full hardware mode pipeline.

---

## 7. Machine Learning Pipeline & Training

1. **RandomForestRegressor**: Learns time-series lag features from historical telemetry in SQLite to project +10 min, +20 min, +30 min water levels and time remaining until low level (\(\le 20\%\)).
2. **IsolationForest**: Detects anomalous sensor spikes or statistical outliers.
3. To retrain models on newly collected data, click **Retrain ML Models** on the AI Leak & Forecast page or call `POST /api/ml/train`.
