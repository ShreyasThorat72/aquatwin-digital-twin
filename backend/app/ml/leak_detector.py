from typing import List, Dict, Any

class LeakDetector:
    def __init__(self):
        self.consecutive_drops = 0
        self.leak_start_time = None
        self.initial_level = None

    def analyze(self, 
                current_level: float, 
                previous_level: float, 
                motor_status: str, # ON or OFF
                inlet_status: str, # OPEN or CLOSED
                outlet_status: str, # OPEN or CLOSED
                anomaly_signal: bool = False) -> Dict[str, Any]:
        """
        Analyze current state for potential leaks.
        """
        is_isolated_system = (motor_status == "OFF" and inlet_status == "CLOSED" and outlet_status == "CLOSED")
        delta = current_level - previous_level # negative if dropping

        if is_isolated_system and delta < -0.05: # level dropping when system closed
            self.consecutive_drops += 1
            rate_of_change = round(delta * 60.0, 2) # % per minute approx

            if self.consecutive_drops == 1:
                self.initial_level = previous_level

            duration_seconds = self.consecutive_drops # assuming 1s interval

            severity = "INFO"
            if self.consecutive_drops >= 10:
                severity = "CRITICAL"
            elif self.consecutive_drops >= 5:
                severity = "WARNING"

            is_possible_leak = self.consecutive_drops >= 3

            return {
                "is_leak": is_possible_leak,
                "status": "POSSIBLE LEAK" if is_possible_leak else "NORMAL",
                "severity": severity if is_possible_leak else "NONE",
                "current_level": current_level,
                "previous_level": previous_level,
                "rate_of_change_pct_min": rate_of_change,
                "consecutive_drops_count": self.consecutive_drops,
                "duration_seconds": duration_seconds,
                "anomaly_signal_active": anomaly_signal,
                "reason": f"Level dropping continuously ({abs(delta):.2f}%) while Motor is OFF, Inlet & Outlet are CLOSED." if is_possible_leak else "No leak detected"
            }
        else:
            self.consecutive_drops = 0
            self.initial_level = None
            return {
                "is_leak": False,
                "status": "NORMAL",
                "severity": "NONE",
                "current_level": current_level,
                "previous_level": previous_level,
                "rate_of_change_pct_min": 0.0,
                "consecutive_drops_count": 0,
                "duration_seconds": 0,
                "anomaly_signal_active": anomaly_signal,
                "reason": "System open or water level stable/rising."
            }

leak_detector = LeakDetector()
