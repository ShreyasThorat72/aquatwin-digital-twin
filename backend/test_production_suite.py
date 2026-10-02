import sys
import os
import unittest
import json
import time
from fastapi.testclient import TestClient

# Add parent dir to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database.database import init_db, db_execute

class TestProductionSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.client = TestClient(app)

    def test_01_cors_preflight(self):
        """Test OPTIONS preflight request for CORS header verification"""
        response = self.client.options(
            "/api/employees",
            headers={
                "Origin": "https://aquatwin-digital-twin-6ozq.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            }
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "https://aquatwin-digital-twin-6ozq.vercel.app"
        )

    def test_02_operator_creation(self):
        """BUG 1: Test creation of an operator/employee"""
        op_id = f"OP_{int(time.time())}"
        payload = {

            "employee_id": op_id,
            "name": "Test Operator",
            "department": "Operations",
            "designation": "Junior SCADA Operator",
            "assigned_shift": "Shift A",
            "role": "OPERATOR",
            "password": "Password123!"
        }

        response = self.client.post("/api/employees", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("employee", data)
        self.assertEqual(data["employee"]["name"], "Test Operator")

    def test_03_settings_save(self):
        """Test settings retrieval and update"""
        res_get = self.client.get("/api/settings")
        self.assertEqual(res_get.status_code, 200)
        
        payload = {"settings": {"high_level_threshold": "95", "low_level_threshold": "15"}}
        res_post = self.client.post("/api/settings", json=payload)
        self.assertEqual(res_post.status_code, 200)
        self.assertEqual(res_post.json()["status"], "success")

    def test_04_actuator_control(self):
        """Test controlling tank actuators"""
        payload = {"actuator": "motor", "command": "ON", "employee_id": "EMP001"}
        res = self.client.post("/api/tank/actuators", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["all_actuators"]["motor"], "ON")

    def test_05_web_scraper(self):
        """BUG 2: Test web scraper execution and status"""
        res_status = self.client.get("/api/scraping/data")
        self.assertEqual(res_status.status_code, 200)

        # Run scraper trigger
        res_run = self.client.post("/api/scraping/run")
        self.assertEqual(res_run.status_code, 200)
        data = res_run.json()
        self.assertEqual(data["status"], "complete")


    def test_06_csv_endpoints(self):
        """BUG 3: Test CSV file listing and view"""
        res = self.client.get("/api/csv/files")
        self.assertEqual(res.status_code, 200)
        files = res.json()
        self.assertIsInstance(files, list)

    def test_07_ml_endpoints(self):
        """BUG 4: Test ML status and training"""
        res_status = self.client.get("/api/ml/status")
        self.assertEqual(res_status.status_code, 200)

        res_train = self.client.post("/api/ml/train")
        self.assertEqual(res_train.status_code, 200)
        data = res_train.json()
        self.assertEqual(data["status"], "success")

    def test_08_telemetry_history(self):
        """Test telemetry status and history retrieval"""
        res_status = self.client.get("/api/hardware/status")
        self.assertEqual(res_status.status_code, 200)

        res_hist = self.client.get("/api/hardware/history")
        self.assertEqual(res_hist.status_code, 200)
        self.assertIsInstance(res_hist.json(), list)

if __name__ == "__main__":
    unittest.main()
