import asyncio
import time
from datetime import datetime
from typing import Dict, Any

class SimulationEngine:
    def __init__(self):
        self.is_running = True
        self.speed_multiplier = 1.0 # 1x, 2x, 5x, 10x
        self.tick_rate_seconds = 1.0
        
        # Tank Physical State
        self.capacity_liters = 1000.0
        self.tank_height_cm = 150.0
        self.current_volume_liters = 500.0 # Start at 50%
        
        # Actuator Controls (Simulated)
        self.motor_status = "OFF" # ON / OFF
        self.inlet_status = "CLOSED" # OPEN / CLOSED
        self.outlet_status = "OPEN" # OPEN / CLOSED
        self.control_mode = "MANUAL" # AUTO / MANUAL
        
        # Inflow / Outflow Rates (Liters / sec)
        self.inflow_rate_lps = 8.0 # when inlet or motor is ON
        self.outflow_rate_lps = 5.0 # when outlet is OPEN

        self.last_update_time = time.time()
        self.tick_count = 0

    def set_speed(self, speed: float):
        self.speed_multiplier = max(1.0, min(10.0, float(speed)))

    def set_control(self, key: str, value: str):
        if key == "motor":
            self.motor_status = value
        elif key == "inlet":
            self.inlet_status = value
        elif key == "outlet":
            self.outlet_status = value
        elif key == "mode":
            self.control_mode = value

    def reset_physics(self):
        self.current_volume_liters = 500.0
        self.motor_status = "OFF"
        self.inlet_status = "CLOSED"
        self.outlet_status = "OPEN"
        self.tick_count = 0

    def tick(self) -> Dict[str, Any]:
        """Perform 1 physics simulation step (dV = (Qin - Qout) * dt)."""
        dt = 1.0 * self.speed_multiplier # simulated elapsed time
        self.tick_count += 1

        # Auto Control Logic
        water_level_pct = (self.current_volume_liters / self.capacity_liters) * 100.0
        if self.control_mode == "AUTO":
            if water_level_pct <= 20.0:
                self.motor_status = "ON"
                self.inlet_status = "OPEN"
                self.outlet_status = "CLOSED"
            elif water_level_pct >= 90.0:
                self.motor_status = "OFF"
                self.inlet_status = "CLOSED"
                self.outlet_status = "OPEN"

        # Inflow Q_in
        q_in = 0.0
        if self.motor_status == "ON" or self.inlet_status == "OPEN":
            q_in += self.inflow_rate_lps

        # Outflow Q_out
        q_out = 0.0
        if self.outlet_status == "OPEN":
            q_out += self.outflow_rate_lps

        # Physics: V_new = V_old + (Qin - Qout) * dt
        v_new = self.current_volume_liters + (q_in - q_out) * dt
        v_new = max(0.0, min(self.capacity_liters, v_new)) # Clamp [0, Vmax]
        self.current_volume_liters = v_new

        level_pct = round((self.current_volume_liters / self.capacity_liters) * 100.0, 1)
        water_height_cm = round((level_pct / 100.0) * self.tank_height_cm, 1)
        distance_cm = round(self.tank_height_cm - water_height_cm, 1)

        return {
            "device_id": "AQUATWIN-SIM-01",
            "distance_cm": distance_cm,
            "water_height_cm": water_height_cm,
            "water_level_percent": level_pct,
            "volume_liters": round(self.current_volume_liters, 1),
            "timestamp": datetime.now().isoformat(),
            "uptime_ms": self.tick_count * 1000,
            "sensor_status": "NORMAL",
            "q_in_lps": q_in,
            "q_out_lps": q_out,
            "motor_status": self.motor_status,
            "inlet_status": self.inlet_status,
            "outlet_status": self.outlet_status,
            "control_mode": self.control_mode
        }

simulation_engine = SimulationEngine()
