"""
========================================================
AquaTwin - HARDWARE TEST SIMULATOR
========================================================
This script emulates a physical ESP32 microcontroller with an
HC-SR04 Ultrasonic Water Level Sensor.

It sends JSON HTTP POST telemetry packets to FastAPI at:
http://localhost:8000/api/hardware/telemetry

Use this script to test the complete real-time hardware telemetry
pipeline before connecting physical ESP32 hardware!
"""

import time
import random
import requests
import json
from datetime import datetime

BACKEND_URL = "http://localhost:8000/api/hardware/telemetry"
DEVICE_ID = "AQUATWIN-ESP32-01"
TANK_HEIGHT_CM = 150.0

def run_hardware_test_simulator():
    print("========================================================")
    print("      HARDWARE TEST SIMULATOR STARTING (ESP32 EMULATOR) ")
    print("========================================================")
    print(f"Target Endpoint: {BACKEND_URL}")
    print(f"Device ID:       {DEVICE_ID}")
    print(f"Tank Height:     {TANK_HEIGHT_CM} cm")
    print("Press Ctrl+C to stop simulation.\n")

    current_water_height = 75.0 # Start at 50%
    uptime_ms = 0

    while True:
        try:
            # Simulate slight physical wave/fluctuation or gradual change
            delta = random.uniform(-1.5, 1.8)
            current_water_height = max(10.0, min(140.0, current_water_height + delta))

            distance_cm = round(TANK_HEIGHT_CM - current_water_height, 1)
            water_height_cm = round(current_water_height, 1)
            water_level_percent = round((water_height_cm / TANK_HEIGHT_CM) * 100.0, 1)

            payload = {
                "device_id": DEVICE_ID,
                "distance_cm": distance_cm,
                "water_height_cm": water_height_cm,
                "water_level_percent": water_level_percent,
                "timestamp": datetime.now().isoformat(),
                "uptime_ms": uptime_ms,
                "sensor_status": "NORMAL"
            }

            resp = requests.post(BACKEND_URL, json=payload, timeout=3)
            if resp.status_code == 200:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] [HARDWARE SIM] Posted: Level={water_level_percent}% | Height={water_height_cm}cm | Dist={distance_cm}cm | Status={resp.status_code}")
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] [HARDWARE SIM ERROR] HTTP {resp.status_code}: {resp.text}")

        except requests.exceptions.ConnectionError:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [HARDWARE SIM ERROR] Backend server unreachable at {BACKEND_URL}. Ensure FastAPI is running!")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [HARDWARE SIM EXCEPTION] {e}")

        uptime_ms += 1000
        time.sleep(1.0)

if __name__ == "__main__":
    run_hardware_test_simulator()
