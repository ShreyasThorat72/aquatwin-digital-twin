import json

test_cases = [
    "https://aquatwin-digital-twin-6ozq.vercel.app",
    "https://aquatwin-digital-twin-6ozq.vercel.app/",
    '"https://aquatwin-digital-twin-6ozq.vercel.app"',
    '["https://aquatwin-digital-twin-6ozq.vercel.app"]',
    "https://aquatwin-digital-twin-6ozq.vercel.app, http://localhost:5173",
]

default_origins = [
    "https://aquatwin-digital-twin-6ozq.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

for case in test_cases:
    allowed_origins = list(default_origins)
    cors_env = case.strip()
    is_json = False
    if cors_env.startswith("[") and cors_env.endswith("]"):
        try:
            parsed = json.loads(cors_env)
            if isinstance(parsed, list):
                is_json = True
                for item in parsed:
                    clean = str(item).strip().strip("'\"").rstrip("/")
                    if clean and clean not in allowed_origins:
                        allowed_origins.append(clean)
        except Exception:
            is_json = False

    if not is_json:
        for raw in cors_env.split(","):
            clean = raw.strip().strip("'\"").rstrip("/")
            if clean and clean not in allowed_origins:
                allowed_origins.append(clean)
    
    print(f"Input: {case:65s} -> Parsed: {allowed_origins}")
