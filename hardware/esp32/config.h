#ifndef CONFIG_H
#define CONFIG_H

// ==========================================
// AquaTwin ESP32 Configuration Header
// ==========================================

// Wi-Fi Credentials (Do not hardcode sensitive passwords in production)
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Backend Server Configuration
// IMPORTANT: Replace COMPUTER_LAN_IP with your computer's local IP address (e.g. http://192.168.1.100:8000)
#define BACKEND_URL "http://192.168.1.10:8000/api/hardware/telemetry"

// Device Identifier
#define DEVICE_ID "AQUATWIN-ESP32-01"

// Pin Definitions for HC-SR04 Ultrasonic Sensor
#define TRIGGER_PIN 5
#define ECHO_PIN 18

// Physical Tank Setup Parameters
#define TANK_HEIGHT_CM 150.0
#define TANK_CAPACITY_LITERS 1000.0

// Telemetry Transmission Rate (Milliseconds)
#define TELEMETRY_INTERVAL_MS 1000

#endif // CONFIG_H
