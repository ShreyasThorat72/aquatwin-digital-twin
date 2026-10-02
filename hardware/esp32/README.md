# AquaTwin ESP32 Hardware Integration Guide

## 1. Overview
This directory contains the complete C++ firmware (`aquatwin_esp32.ino`) and configuration header (`config.h`) for connecting an ESP32 microcontroller with an HC-SR04 Ultrasonic Water Level Sensor to the AquaTwin SCADA backend.

---

## 2. Hardware Wiring & Safety Guide

> [!WARNING]
> **CRITICAL VOLTAGE SAFETY NOTICE:**
> The HC-SR04 Ultrasonic Sensor operates on **5V DC**. Its `Echo` pin outputs a **5V logic signal**.
> The ESP32 GPIO pins are **NOT 5V tolerant** (max 3.3V).
> Connecting the HC-SR04 `Echo` pin directly to an ESP32 GPIO will damage the ESP32 pin over time!
> You **MUST** use a voltage divider or logic level converter on the Echo line.

### Wiring Diagram & Schematic:

```
  HC-SR04 Sensor                 ESP32 Development Board
+-----------------+            +-------------------------+
| VCC (5V)        | ---------> | 5V / VIN / VBUS Pin     |
| GND             | ---------> | GND                     |
| Trig            | ---------> | GPIO 5 (Configurable)   |
| Echo            | --[R1]--+->| GPIO 18 (Configurable)  |
+-----------------+         |  +-------------------------+
                           [R2]
                            |
                           GND
```

### Voltage Divider Calculation:
- **Resistor R1 (between HC-SR04 Echo & ESP32 GPIO 18):** 1kΩ
- **Resistor R2 (between ESP32 GPIO 18 & GND):** 2kΩ
- Output Voltage: \( V_{out} = 5\text{V} \times \frac{2\text{k}\Omega}{1\text{k}\Omega + 2\text{k}\Omega} = 3.33\text{V} \) (Safe for ESP32)

---

## 3. Configuration (`config.h`)
Edit `hardware/esp32/config.h` before flashing to your ESP32:

```cpp
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define BACKEND_URL "http://YOUR_COMPUTER_LAN_IP:8000/api/hardware/telemetry"
#define DEVICE_ID "AQUATWIN-ESP32-01"
#define TRIGGER_PIN 5
#define ECHO_PIN 18
#define TANK_HEIGHT_CM 150.0
#define TELEMETRY_INTERVAL_MS 1000
```

---

## 4. How to Flash via Arduino IDE
1. Open Arduino IDE.
2. Go to **File -> Preferences -> Additional Boards Manager URLs**:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Go to **Tools -> Board -> Boards Manager**, search `esp32` by Espressif Systems and click Install.
4. Select your board under **Tools -> Board -> ESP32 Arduino -> ESP32 Dev Module**.
5. Install the **ArduinoJson** library (v6 or v7) via **Tools -> Manage Libraries**.
6. Select your COM Port under **Tools -> Port**.
7. Click **Upload**.

---

## 5. Telemetry JSON Payload Format
The ESP32 sends HTTP POST requests to `/api/hardware/telemetry`:

```json
{
  "device_id": "AQUATWIN-ESP32-01",
  "distance_cm": 28.4,
  "water_height_cm": 121.6,
  "water_level_percent": 81.1,
  "uptime_ms": 123456,
  "sensor_status": "NORMAL"
}
```
