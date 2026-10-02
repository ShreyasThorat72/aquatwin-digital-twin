import requests
import json

BASE_URL = "http://localhost:8000"
ORIGIN = "https://aquatwin-digital-twin-6ozq.vercel.app"

print("========================================================")
print("         AQUATWIN CORS PREFLIGHT & ROUTE TESTING        ")
print("========================================================\n")

# 1. Test OPTIONS Preflight Request on /api/tank/actuators
print("TEST 1: Preflight OPTIONS /api/tank/actuators")
options_headers = {
    "Origin": ORIGIN,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type, authorization"
}
try:
    resp = requests.options(f"{BASE_URL}/api/tank/actuators", headers=options_headers, timeout=5)
    print(f"Status Code: {resp.status_code}")
    print("Response Headers:")
    for h, v in resp.headers.items():
        if "access-control" in h.lower():
            print(f"  {h}: {v}")
    
    allow_origin = resp.headers.get("Access-Control-Allow-Origin")
    if allow_origin == ORIGIN or allow_origin == "*":
        print(f"SUCCESS: Access-Control-Allow-Origin header is present and valid ({allow_origin})\n")
    else:
        print(f"FAILED: Access-Control-Allow-Origin missing or mismatch: {allow_origin}\n")
except Exception as e:
    print(f"EXCEPTION: {e}\n")

# 2. Test POST /api/tank/actuators
print("TEST 2: POST /api/tank/actuators")
post_headers = {
    "Origin": ORIGIN,
    "Content-Type": "application/json"
}
payload = {"actuator": "motor", "command": "ON", "employee_id": "EMP001"}
try:
    resp = requests.post(f"{BASE_URL}/api/tank/actuators", headers=post_headers, json=payload, timeout=5)
    print(f"Status Code: {resp.status_code}")
    print(f"Allow-Origin Header: {resp.headers.get('Access-Control-Allow-Origin')}")
    print(f"Response Payload: {resp.json()}\n")
except Exception as e:
    print(f"EXCEPTION: {e}\n")

# 3. Test GET /api/hardware/history?limit=25
print("TEST 3: GET /api/hardware/history?limit=25")
get_headers = {"Origin": ORIGIN}
try:
    resp = requests.get(f"{BASE_URL}/api/hardware/history?limit=25", headers=get_headers, timeout=5)
    print(f"Status Code: {resp.status_code}")
    print(f"Allow-Origin Header: {resp.headers.get('Access-Control-Allow-Origin')}")
    print(f"Records Count: {len(resp.json())}\n")
except Exception as e:
    print(f"EXCEPTION: {e}\n")
