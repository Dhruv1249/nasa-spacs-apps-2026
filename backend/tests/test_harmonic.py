import unittest
import numpy as np
from app.services.sar_processor import (
    fit_first_order_harmonic,
    linear_to_db,
    db_to_linear,
    harmonic_to_rgb
)
from app.services.sonifier_math import classify_land_cover, calculate_sonification_profile

class TestSARProcessor(unittest.TestCase):
    def test_linear_db_conversion(self):
        lin = np.array([1.0, 10.0, 100.0, 0.001])
        db = linear_to_db(lin)
        self.assertAlmostEqual(db[0], 0.0, places=4)
        self.assertAlmostEqual(db[1], 10.0, places=4)
        self.assertAlmostEqual(db[2], 20.0, places=4)
        self.assertAlmostEqual(db[3], -30.0, places=4)
        
        recovered_lin = db_to_linear(db)
        np.testing.assert_allclose(recovered_lin, lin, rtol=1e-4)

    def test_harmonic_fit_recovery(self):
        """Verify harmonic solver recovers exact synthetic amplitude and phase."""
        doys = np.linspace(0, 360, 30)
        omega = 2.0 * np.pi / 365.0
        
        true_a0 = -12.0
        true_a1 = 3.5
        true_b1 = -2.0
        true_amp = np.sqrt(true_a1**2 + true_b1**2)
        true_phase = np.arctan2(true_b1, true_a1) % (2.0 * np.pi)
        
        synthetic_y = true_a0 + true_a1 * np.cos(omega * doys) + true_b1 * np.sin(omega * doys)
        
        result = fit_first_order_harmonic(doys, synthetic_y)
        
        self.assertAlmostEqual(result["a0"], true_a0, places=3)
        self.assertAlmostEqual(result["a1"], true_a1, places=3)
        self.assertAlmostEqual(result["b1"], true_b1, places=3)
        self.assertAlmostEqual(result["amplitude"], true_amp, places=3)
        self.assertAlmostEqual(result["phase_rad"], true_phase, places=3)
        self.assertGreater(result["r_squared"], 0.99)

    def test_land_cover_classification(self):
        # Water
        water_class = classify_land_cover(mean_db=-23.0, amplitude_db=1.0, phase_doy=100, ratio_mean_db=7.0)
        self.assertEqual(water_class["type"], "Open Water / River")
        
        # Rice paddy (summer peak, high amplitude)
        rice_class = classify_land_cover(mean_db=-14.0, amplitude_db=6.5, phase_doy=220, ratio_mean_db=6.0)
        self.assertEqual(rice_class["type"], "Single-Cycle Flooded Rice")
        
        # Permanent orchard (high mean backscatter, low amplitude)
        orchard_class = classify_land_cover(mean_db=-11.0, amplitude_db=1.5, phase_doy=150, ratio_mean_db=5.5)
        self.assertEqual(orchard_class["type"], "Perennial Orchard / Dense Forest")

    def test_harmonic_rgb_shape(self):
        phase = np.zeros((10, 10))
        amp = np.ones((10, 10)) * 4.0
        mean = np.ones((10, 10)) * -14.0
        
        rgb = harmonic_to_rgb(phase, amp, mean)
        self.assertEqual(rgb.shape, (10, 10, 3))
        self.assertEqual(rgb.dtype, np.uint8)

if __name__ == "__main__":
    unittest.main()
