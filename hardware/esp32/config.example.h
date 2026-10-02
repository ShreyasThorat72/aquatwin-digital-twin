#ifndef CONFIG_H
#define CONFIG_H

// ========================================================
// AquaTwin ESP32 Configuration Example Header
// ========================================================
// Instructions:
// 1. Copy this file and rename it to 'config.h' in the same folder.
// 2. Fill in your actual Wi-Fi network SSID and Password.
// 3. For local network testing, set BACKEND_URL to your computer's LAN IP:
//    http://192.168.1.X:8000/api/hardware/telemetry
// 4. For cloud production (Render), set BACKEND_URL to HTTPS:
//    https://YOUR-BACKEND.onrender.com/api/hardware/telemetry
// 5. DO NOT commit your real 'config.h' file to public Git repositories.
// ========================================================

// Wi-Fi Access Credentials
#define WIFI_SSID "YOUR_WIFI_SSID_HERE"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD_HERE"

// Production / Local Backend HTTPS Endpoint
#define BACKEND_URL "http://192.168.1.10:8000/api/hardware/telemetry"

// Microcontroller Unique Identifier
#define DEVICE_ID "AQUATWIN-ESP32-01"

// HC-SR04 Ultrasonic Sensor Pin Assignments
#define TRIG_PIN 5
#define ECHO_PIN 18

// Physical Tank Setup Parameters
#define TANK_HEIGHT_CM 150.0

// Telemetry Transmission Interval (Milliseconds)
#define TELEMETRY_INTERVAL_MS 1000

#endif // CONFIG_H
