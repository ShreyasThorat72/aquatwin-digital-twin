import json
import time
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
from app.database.database import get_db_connection, is_postgres
from app.websocket.ws_manager import ws_manager
from app.ml.anomaly_detector import anomaly_detector
from app.ml.leak_detector import leak_detector
from app.ml.forecaster import water_forecaster

class TelemetryService:
    def __init__(self):
        self.latest_telemetry: Dict[str, Any] = {
            "device_id": "AQUATWIN-ESP32-01",
            "distance_cm": 75.0,
            "water_height_cm": 75.0,
            "water_level_percent": 50.0,
            "volume_liters": 500.0,
            "timestamp": datetime.now().isoformat(),
            "uptime_ms": 0,
            "sensor_status": "NORMAL",
            "data_source": "SIMULATION"
        }
        self.last_hardware_timestamp: Optional[float] = None
        self.esp32_status: str = "OFFLINE"
        self.recent_history: list = [50.0]
        self.active_source_mode: str = "SIMULATION"
        
        # Telemetry metrics tracking
        self.valid_packet_count: int = 0
        self.invalid_packet_count: int = 0

        # Actuator states
        self.actuators = {
            "motor": "OFF",
            "inlet": "CLOSED",
            "outlet": "OPEN",
            "mode": "MANUAL"
        }

    def get_setting(self, key: str, default: str) -> str:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            if is_postgres():
                cursor.execute("SELECT value FROM settings WHERE key = %s", (key,))
            else:
                cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
            row = cursor.fetchone()
            conn.close()
            return row['value'] if row else default
        except Exception:
            return default

    def validate_telemetry(self, data: Dict[str, Any], tank_height: float, tank_capacity: float, sensor_offset: float) -> Tuple[bool, str, Dict[str, Any]]:
        if not isinstance(data, dict):
            return False, "Invalid telemetry payload (not a JSON object)", {}
        
        device_id = data.get("device_id")
        if not device_id:
            return False, "Missing device_id", {}

        try:
            distance_cm = float(data.get("distance_cm", -1.0))
        except (ValueError, TypeError):
            return False, "Invalid distance_cm format", {}

        max_allowed_dist = tank_height + sensor_offset + 50.0
        if distance_cm < 0.0 or distance_cm > max_allowed_dist:
            return False, f"Impossible distance reading: {distance_cm} cm (valid range: 0.0 - {max_allowed_dist} cm)", {}

        # Derived calculations backend enforcement (never trust pre-calculated values blindly)
        effective_dist = max(0.0, distance_cm - sensor_offset)
        water_height_cm = round(max(0.0, tank_height - effective_dist), 1)
        water_level_percent = round(max(0.0, min(100.0, (water_height_cm / tank_height) * 100.0)), 1)
        volume_liters = round((water_level_percent / 100.0) * tank_capacity, 1)

        source_val = str(data.get("data_source", data.get("source", "HARDWARE"))).upper()

        validated = {
            "device_id": str(device_id),
            "distance_cm": round(distance_cm, 1),
            "water_height_cm": water_height_cm,
            "water_level_percent": water_level_percent,
            "volume_liters": volume_liters,
            "timestamp": data.get("timestamp", datetime.now().isoformat()),
            "uptime_ms": int(data.get("uptime_ms", 0)),
            "sensor_status": str(data.get("sensor_status", "NORMAL")),
            "data_source": source_val,
            "source": source_val
        }

        return True, "Valid", validated

    async def process_telemetry(self, raw_data: Dict[str, Any], source: str = "HARDWARE") -> Tuple[bool, str, Dict[str, Any]]:
        tank_height = float(self.get_setting("tank_height_cm", "150"))
        tank_capacity = float(self.get_setting("tank_capacity_liters", "1000"))
        sensor_offset = float(self.get_setting("sensor_offset_cm", "0"))

        if "data_source" not in raw_data and "source" not in raw_data:
            raw_data["data_source"] = source

        is_valid, msg, payload = self.validate_telemetry(raw_data, tank_height, tank_capacity, sensor_offset)

        if not is_valid:
            self.invalid_packet_count += 1
            # Log rejected telemetry
            conn = get_db_connection()
            cursor = conn.cursor()
            now_str = datetime.now().isoformat()
            desc = f"Rejected telemetry from {raw_data.get('device_id', 'UNKNOWN')}: {msg}"
            if is_postgres():
                cursor.execute(
                    "INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description) VALUES (%s, %s, %s, %s, %s, %s)",
                    (now_str, "SYSTEM", "Telemetry Validator", "TELEMETRY", "WARNING", desc)
                )
            else:
                cursor.execute(
                    "INSERT INTO system_logs (timestamp, employee_id, employee_name, module, level, description) VALUES (?, ?, ?, ?, ?, ?)",
                    (now_str, "SYSTEM", "Telemetry Validator", "TELEMETRY", "WARNING", desc)
                )
            conn.commit()
            conn.close()
            return False, msg, {}

        self.valid_packet_count += 1

        # Heartbeat tracking for ESP32 hardware
        if payload["data_source"] == "HARDWARE":
            self.last_hardware_timestamp = time.time()
            self.esp32_status = "ONLINE"

        configured_mode = self.get_setting("data_source_mode", "SIMULATION")
        self.active_source_mode = configured_mode

        # Keep rolling history for ML
        self.recent_history.append(payload["water_level_percent"])
        if len(self.recent_history) > 20:
            self.recent_history.pop(0)

        rate_of_change = 0.0
        if len(self.recent_history) >= 2:
            rate_of_change = round(self.recent_history[-1] - self.recent_history[-2], 2)

        # 1. ML Anomaly Detection
        is_anomaly, anomaly_score, anomaly_reason = anomaly_detector.detect(
            payload["water_level_percent"], payload["distance_cm"], rate_of_change
        )
        payload["is_anomaly"] = 1 if is_anomaly else 0

        # 2. ML Leak Detection
        leak_res = leak_detector.analyze(
            current_level=payload["water_level_percent"],
            previous_level=self.recent_history[-2] if len(self.recent_history)>=2 else payload["water_level_percent"],
            motor_status=self.actuators["motor"],
            inlet_status=self.actuators["inlet"],
            outlet_status=self.actuators["outlet"],
            anomaly_signal=is_anomaly
        )
        payload["is_leak"] = 1 if leak_res["is_leak"] else 0

        # 3. ML Forecast calculation
        forecast_res = water_forecaster.predict_future(payload["water_level_percent"], self.recent_history)

        # 4. Save to SQLite/PostgreSQL Database
        conn = get_db_connection()
        cursor = conn.cursor()

        if is_postgres():
            cursor.execute("""
                INSERT INTO telemetry (timestamp, source, device_id, distance_cm, water_height_cm, water_level_percent, volume_liters, uptime_ms, sensor_status, is_anomaly, is_leak)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                payload["timestamp"], payload["data_source"], payload["device_id"],
                payload["distance_cm"], payload["water_height_cm"], payload["water_level_percent"],
                payload["volume_liters"], payload["uptime_ms"], payload["sensor_status"],
                payload["is_anomaly"], payload["is_leak"]
            ))
        else:
            cursor.execute("""
                INSERT INTO telemetry (timestamp, source, device_id, distance_cm, water_height_cm, water_level_percent, volume_liters, uptime_ms, sensor_status, is_anomaly, is_leak)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                payload["timestamp"], payload["data_source"], payload["device_id"],
                payload["distance_cm"], payload["water_height_cm"], payload["water_level_percent"],
                payload["volume_liters"], payload["uptime_ms"], payload["sensor_status"],
                payload["is_anomaly"], payload["is_leak"]
            ))

        # Check Alarm Thresholds
        low_thresh = float(self.get_setting("low_level_threshold", "20"))
        high_thresh = float(self.get_setting("high_level_threshold", "90"))

        alarms_to_create = []
        if payload["water_level_percent"] <= low_thresh:
            alarms_to_create.append(("LOW_LEVEL", "WARNING", f"Water level reached {payload['water_level_percent']}% (<= {low_thresh}%)"))
        elif payload["water_level_percent"] >= high_thresh:
            alarms_to_create.append(("HIGH_LEVEL", "WARNING", f"Water level reached {payload['water_level_percent']}% (>= {high_thresh}%)"))

        if is_anomaly:
            alarms_to_create.append(("ANOMALY_DETECTED", "WARNING", f"Telemetry Anomaly: {anomaly_reason}"))
        
        if leak_res["is_leak"]:
            alarms_to_create.append(("POSSIBLE_LEAK", leak_res["severity"], leak_res["reason"]))

        for a_type, a_sev, a_desc in alarms_to_create:
            if is_postgres():
                cursor.execute(
                    "SELECT id FROM alarms WHERE alarm_type = %s AND acknowledged = 0 ORDER BY id DESC LIMIT 1;",
                    (a_type,)
                )
            else:
                cursor.execute(
                    "SELECT id FROM alarms WHERE alarm_type = ? AND acknowledged = 0 ORDER BY id DESC LIMIT 1;",
                    (a_type,)
                )
            existing = cursor.fetchone()
            if not existing:
                if is_postgres():
                    cursor.execute(
                        "INSERT INTO alarms (timestamp, alarm_type, severity, description, source, device_id) VALUES (%s, %s, %s, %s, %s, %s)",
                        (datetime.now().isoformat(), a_type, a_sev, a_desc, payload["data_source"], payload["device_id"])
                    )
                else:
                    cursor.execute(
                        "INSERT INTO alarms (timestamp, alarm_type, severity, description, source, device_id) VALUES (?, ?, ?, ?, ?, ?)",
                        (datetime.now().isoformat(), a_type, a_sev, a_desc, payload["data_source"], payload["device_id"])
                    )

        conn.commit()
        conn.close()

        # Update latest telemetry cache
        self.latest_telemetry = payload

        # Broadcast payload via WebSocket
        full_ws_payload = {
            "type": "TELEMETRY_UPDATE",
            "telemetry": payload,
            "anomaly": {
                "is_anomaly": is_anomaly,
                "score": anomaly_score,
                "reason": anomaly_reason
            },
            "leak": leak_res,
            "forecast": forecast_res,
            "actuators": self.actuators,
            "esp32_status": self.get_esp32_health(),
            "data_source_mode": configured_mode
        }

        await ws_manager.broadcast(full_ws_payload)

        return True, "Telemetry processed and broadcasted", payload

    def get_esp32_health(self) -> Dict[str, Any]:
        offline_timeout = float(self.get_setting("offline_timeout_seconds", "5"))
        if self.last_hardware_timestamp is None:
            self.esp32_status = "OFFLINE"
            packet_age = None
        else:
            age = time.time() - self.last_hardware_timestamp
            packet_age = round(age, 1)
            if age > offline_timeout:
                self.esp32_status = "OFFLINE"
            else:
                self.esp32_status = "ONLINE"

        return {
            "status": self.esp32_status,
            "last_packet_age_seconds": packet_age,
            "device_id": self.get_setting("esp32_device_id", "AQUATWIN-ESP32-01"),
            "offline_timeout_config": offline_timeout,
            "packet_count": self.valid_packet_count,
            "invalid_packet_count": self.invalid_packet_count
        }

telemetry_service = TelemetryService()
