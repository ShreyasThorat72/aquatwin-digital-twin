# AquaTwin ESP32 Microcontroller & Ultrasonic Sensor Setup Guide

This guide provides instructions for connecting an **ESP32 Microcontroller** and an **HC-SR04 Ultrasonic Water Level Sensor** to the AquaTwin SCADA backend.

---

## 1. Hardware Required

- ESP32 Development Board (e.g. ESP32 Dev Module, NodeMCU-32S, ESP-WROOM-32).
- HC-SR04 or HC-SR04P Ultrasonic Sensor.
- Resistors for Voltage Divider: **1x 1kΩ** and **1x 2kΩ** (or 2.2kΩ).
- Breadboard & Jumper Wires.
- Micro-USB cable.

---

## 2. Hardware Wiring Diagram & Overvoltage Protection

> [!WARNING]
> **CRITICAL VOLTAGE SAFETY WARNING:**
> The HC-SR04 sensor operates on **5V DC** and outputs a **5V logic signal** on its `Echo` pin.
> ESP32 GPIO pins are rated for a maximum of **3.3V**.
> Connecting the HC-SR04 `Echo` pin directly to an ESP32 GPIO will damage the microcontroller pin!
> You **MUST** use a voltage divider on the Echo line.

### Circuit Wiring Schematic:

```
  HC-SR04 Sensor                 ESP32 Development Board
+-----------------+            +-------------------------+
| VCC (5V)        | ---------> | 5V / VIN / VBUS Pin     |
| GND             | ---------> | GND                     |
| Trig            | ---------> | GPIO 5                  |
| Echo            | --[1kΩ]--+->| GPIO 18                 |
+-----------------+          | +-------------------------+
                           [2kΩ]
                             |
                            GND
```

### Resistor Voltage Divider Math:
\[ V_{out} = V_{in} \times \frac{R_2}{R_1 + R_2} = 5.0\text{V} \times \frac{2000}{1000 + 2000} = 3.33\text{V} \]
This steps down the 5V Echo pulse to a safe 3.33V level for ESP32 GPIO 18.

---

## 3. Firmware Configuration

1. Locate `hardware/esp32/config.example.h`.
2. Create a copy named `config.h` in the same directory (`hardware/esp32/config.h`).
3. Edit `config.h` with your Wi-Fi credentials and target backend URL:

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi Credentials
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

// Target Backend Telemetry Endpoint
// For Local Testing: Use your computer's LAN IP
#define BACKEND_URL "http://192.168.1.10:8000/api/hardware/telemetry"

// For Render Production Deployment: Use your Render HTTPS URL
// #define BACKEND_URL "https://aquatwin-backend.onrender.com/api/hardware/telemetry"

// Device Identifier
#define DEVICE_ID "AQUATWIN-ESP32-01"

// Pin Assignments
#define TRIG_PIN 5
#define ECHO_PIN 18

// Physical Tank Geometry (Height in centimeters)
#define TANK_HEIGHT_CM 150.0

// Transmission Rate (1000ms = 1 packet per second)
#define TELEMETRY_INTERVAL_MS 1000

#endif
```

---

## 4. Arduino IDE Flashing Guide

1. Download and install [Arduino IDE](https://www.arduino.cc/en/software).
2. Open **File -> Preferences** and add the ESP32 board manager URL:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Go to **Tools -> Board -> Boards Manager**, search `esp32` by Espressif Systems, and click **Install**.
4. Go to **Tools -> Manage Libraries**, search `ArduinoJson`, and install version 6 or 7.
5. Open `hardware/esp32/aquatwin_esp32.ino` in Arduino IDE.
6. Select Board: **Tools -> Board -> ESP32 Arduino -> ESP32 Dev Module**.
7. Connect your ESP32 via USB and select port: **Tools -> Port**.
8. Click **Upload**.

---

## 5. Serial Monitor Verification

Open **Tools -> Serial Monitor** at **115200 baud**. You should observe:

```text
==========================================
  AquaTwin SCADA ESP32 Firmware Starting  
==========================================
[Wi-Fi] Connecting to: Your_WiFi_SSID
.....
[Wi-Fi] Connected successfully!
[Wi-Fi] Local IP: 192.168.1.45
[HTTP POST] Code: 200 | Distance: 34.2 cm
[HTTP POST] Code: 200 | Distance: 34.1 cm
```

---

## 6. Common Error Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `[Wi-Fi] Connection Failed` | Incorrect SSID/Password or 5GHz Wi-Fi band | Verify credentials; connect to 2.4GHz Wi-Fi network |
| `HTTP ERROR -1` | Cannot reach server IP/host | Check computer firewall; ensure FastAPI is listening on `0.0.0.0:8000` |
| `HTTP 400` | Rejected telemetry (out of range distance) | Check HC-SR04 sensor distance; range must be 0-200 cm |
| Distance returns `-1.0` | Sensor trig/echo pin dislodged or sensor fault | Check jumper connections on Trig (GPIO 5) and Echo (GPIO 18) |
