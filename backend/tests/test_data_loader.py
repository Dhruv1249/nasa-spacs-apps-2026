import unittest
import os
import numpy as np
from app.services.data_loader import SARDataLoader
from app.config import REGIONS

class TestSARDataLoader(unittest.TestCase):
    def setUp(self):
        data_root = os.path.join(os.path.dirname(__file__), "..", "app", "data")
        self.loader = SARDataLoader(data_root=data_root)

    def test_cache_loaded(self):
        self.assertIn("sacramento", self.loader.cache)
        self.assertIn("punjab", self.loader.cache)

    def test_heartbeat_image(self):
        img_bytes = self.loader.get_heartbeat_image("sacramento")
        self.assertIsNotNone(img_bytes)
        self.assertTrue(img_bytes.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_query_point_sacramento(self):
        pt = self.loader.query_point("sacramento", lat=38.83, lon=-121.72)
        self.assertIsNotNone(pt)
        self.assertEqual(pt["region"], "sacramento")
        self.assertIn("harmonic", pt)
        self.assertIn("classification", pt)
        self.assertIn("sonification", pt)
        self.assertIn("note_events", pt["sonification"])
        self.assertEqual(len(pt["time_series"]), 25)

    def test_query_point_punjab(self):
        pt = self.loader.query_point("punjab", lat=30.90, lon=75.85)
        self.assertIsNotNone(pt)
        self.assertEqual(pt["region"], "punjab")
        self.assertIn("type", pt["classification"])
        self.assertGreater(pt["sonification"]["tempo_bpm"], 0)

if __name__ == "__main__":
    unittest.main()
