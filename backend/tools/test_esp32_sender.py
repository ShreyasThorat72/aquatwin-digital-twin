"""
========================================================
AquaTwin - ESP32 Hardware Test Telemetry Sender
========================================================
This tool emulates an ESP32 sending real JSON telemetry packets
over HTTP/HTTPS to the FastAPI backend.

Endpoint: POST /api/hardware/telemetry
"""

import time
import random
import requests
import json
import os
import sys
from datetime import datetime

# Default API URL (local dev or production)
API_URL = os.environ.get("BACKEND_URL", "http://localhost:8000/api/hardware/telemetry")
DEVICE_ID = "AQUATWIN-ESP32-01"
TANK_HEIGHT_CM = 150.0

def run_test_sender():
    print("========================================================")
    print("       AQUATWIN ESP32 HARDWARE TEST SENDER TOOL         ")
    print("========================================================")
    print(f"Target URL: {API_URL}")
    print(f"Device ID:  {DEVICE_ID}")
    print("Press Ctrl+C to stop.\n")

    water_height = 75.0 # Start at 50% level
    uptime_ms = 0

    while True:
        try:
            # Simulate physical water level movement
            delta = random.uniform(-1.5, 1.8)
            water_height = max(10.0, min(140.0, water_height + delta))

            distance_cm = round(TANK_HEIGHT_CM - water_height, 1)

            payload = {
                "device_id": DEVICE_ID,
                "distance_cm": distance_cm,
                "timestamp": datetime.now().isoformat(),
                "uptime_ms": uptime_ms,
                "sensor_status": "NORMAL",
                "data_source": "SIMULATION" # Explicitly mark test data
            }

            resp = requests.post(API_URL, json=payload, timeout=5)
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Posted: Distance={distance_cm}cm | Height={data.get('water_height_cm')}cm | Level={data.get('water_level_percent')}% | HTTP {resp.status_code}")
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] HTTP Error {resp.status_code}: {resp.text}")

        except requests.exceptions.ConnectionError:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Connection Error: Unreachable at {API_URL}")
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Exception: {e}")

        uptime_ms += 1000
        time.sleep(1.0)

if __name__ == "__main__":
    run_test_sender()
