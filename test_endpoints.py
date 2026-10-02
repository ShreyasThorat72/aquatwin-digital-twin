import requests
import json

BASE_URL = "http://localhost:8000"

endpoints = [
    "/",
    "/api/tank/state",
    "/api/hardware/status",
    "/api/hardware/latest",
    "/api/hardware/history",
    "/api/hardware/devices",
    "/api/simulation/start",
    "/api/employees",
    "/api/shifts/active",
    "/api/scraping/data",
    "/api/csv/files",
    "/api/ml/status",
    "/api/ml/forecast",
    "/api/analytics",
    "/api/alarms",
    "/api/reports/list",
    "/api/logs",
    "/api/settings"
]

print("=== TESTING FASTAPI ENDPOINTS ===")
for ep in endpoints:
    try:
        r = requests.get(f"{BASE_URL}{ep}", timeout=2) if not ep.startswith("/api/simulation") else requests.post(f"{BASE_URL}{ep}", timeout=2)
        print(f"[{r.status_code}] {ep}")
    except Exception as e:
        print(f"[FAIL] {ep}: {e}")
