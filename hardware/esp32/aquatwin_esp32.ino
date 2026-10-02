/*
  AquaTwin ESP32 Industrial SCADA Telemetry Firmware
  Reads Ultrasonic Water Level (HC-SR04) and posts JSON telemetry over Wi-Fi/HTTPS to FastAPI backend.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// Include configuration header (Fallback to config.example.h if config.h is not found)
#if __has_include("config.h")
  #include "config.h"
#else
  #include "config.example.h"
#endif

// Compatibility mapping for pin macros
#ifndef TRIG_PIN
  #ifdef TRIGGER_PIN
    #define TRIG_PIN TRIGGER_PIN
  #else
    #define TRIG_PIN 5
  #endif
#endif

#ifndef ECHO_PIN
  #define ECHO_PIN 18
#endif

unsigned long lastTelemetryTime = 0;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5m max range)
  if (duration == 0) {
    return -1.0; // Sensor Timeout / Fault
  }

  // Speed of sound: 343 m/s = 0.0343 cm/us -> distance = (duration * 0.0343) / 2
  float distance = (duration * 0.0343) / 2.0;
  return distance;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("[Wi-Fi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Connection Failed. Will retry in main loop...");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("==========================================");
  Serial.println("  AquaTwin SCADA ESP32 Firmware Starting  ");
  Serial.println("==========================================");

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  connectWiFi();
}

void loop() {
  // Automatic Wi-Fi reconnection check
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;

    float distance = readDistanceCm();
    String sensorStatus = "NORMAL";

    if (distance < 0 || distance > (TANK_HEIGHT_CM + 50.0)) {
      sensorStatus = "FAULT_OUT_OF_RANGE";
    }

    // Create JSON Telemetry Payload
    StaticJsonDocument<256> doc;
    doc["device_id"] = DEVICE_ID;
    doc["distance_cm"] = round(distance * 10.0) / 10.0;
    doc["timestamp"] = ""; // Backend sets ISO timestamp
    doc["uptime_ms"] = currentMillis;
    doc["sensor_status"] = sensorStatus;
    doc["data_source"] = "HARDWARE";

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String backendUrl = String(BACKEND_URL);

      if (backendUrl.startsWith("https://")) {
        WiFiClientSecure client;
        client.setInsecure(); // Skip SSL certificate verification for Render/Cloud endpoints
        http.begin(client, backendUrl);
      } else {
        http.begin(backendUrl);
      }

      http.addHeader("Content-Type", "application/json");
      int httpCode = http.POST(jsonPayload);

      if (httpCode > 0) {
        Serial.print("[HTTP POST] Code: ");
        Serial.print(httpCode);
        Serial.print(" | Distance: ");
        Serial.print(distance);
        Serial.println(" cm");
      } else {
        Serial.print("[HTTP ERROR] Failed, error: ");
        Serial.println(http.errorToString(httpCode));
      }

      http.end();
    } else {
      Serial.println("[ERROR] Cannot send telemetry: Wi-Fi Disconnected");
    }
  }
}
