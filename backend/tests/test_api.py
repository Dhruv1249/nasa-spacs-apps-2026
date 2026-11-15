import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestAPIEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        json_data = res.json()
        self.assertEqual(json_data["status"], "healthy")
        self.assertIn("sacramento", json_data["regions_loaded"])
        self.assertIn("punjab", json_data["regions_loaded"])

    def test_regions(self):
        res = self.client.get("/api/regions")
        self.assertEqual(res.status_code, 200)
        regions = res.json()["regions"]
        self.assertEqual(len(regions), 2)
        ids = [r["id"] for r in regions]
        self.assertIn("sacramento", ids)
        self.assertIn("punjab", ids)

    def test_heartbeat_image(self):
        res = self.client.get("/api/heartbeat/sacramento/image.png")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers["content-type"], "image/png")
        self.assertTrue(res.content.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_point_query_sacramento(self):
        res = self.client.get("/api/point?region=sacramento&lat=38.83&lon=-121.72")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["region"], "sacramento")
        self.assertIn("harmonic", data)
        self.assertIn("classification", data)
        self.assertIn("sonification", data)
        self.assertIn("time_series", data)
        self.assertGreater(len(data["time_series"]), 10)
        self.assertIn("note_events", data["sonification"])
        self.assertIn("decadal_time_series", data)
        self.assertGreater(len(data["decadal_time_series"]), 100)
        self.assertIn("decadal_sonification", data)
        self.assertEqual(data["decadal_sonification"]["total_epochs"], len(data["decadal_time_series"]))

    def test_point_query_punjab(self):
        res = self.client.get("/api/point?region=punjab&lat=30.90&lon=75.85")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["region"], "punjab")
        self.assertIn("harmonic", data)
        self.assertIn("sonification", data)
        self.assertIn("decadal_time_series", data)
        self.assertGreater(len(data["decadal_time_series"]), 100)

if __name__ == "__main__":
    unittest.main()
