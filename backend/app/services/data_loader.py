import os
import numpy as np
from typing import Dict, Any, Optional
from app.config import REGIONS, RegionConfig
from app.services.sar_processor import fit_first_order_harmonic
from app.services.sonifier_math import calculate_sonification_profile
from app.services.image_utils import array_to_png_bytes

class SARDataLoader:
    def __init__(self, data_root: str):
        self.data_root = data_root
        self.cache: Dict[str, Dict[str, Any]] = {}
        self._load_all_regions()

    def _load_all_regions(self):
        for region_id in REGIONS.keys():
            region_dir = os.path.join(self.data_root, region_id)
            npz_path = os.path.join(region_dir, "sar_stack.npz")
            png_path = os.path.join(region_dir, "heartbeat.png")
            
            if not os.path.exists(npz_path) or not os.path.exists(png_path):
                from scripts.generate_dataset import generate_region_dataset
                generate_region_dataset(region_id, width=500, height=500, num_dates=25, output_dir=self.data_root)

            if os.path.exists(npz_path):
                data = np.load(npz_path)
                self.cache[region_id] = {
                    "dates": list(data["dates"]),
                    "doys": [int(d) for d in data["doys"]],
                    "lats": data["lats"],
                    "lons": data["lons"],
                    "copol_stack": data["copol_stack"],      # (T, H, W)
                    "crosspol_stack": data["crosspol_stack"],# (T, H, W)
                    "a0": data["a0"],
                    "amplitude": data["amplitude"],
                    "phase_rad": data["phase_rad"]
                }
            if os.path.exists(png_path):
                with open(png_path, "rb") as f:
                    if region_id not in self.cache:
                        self.cache[region_id] = {}
                    self.cache[region_id]["heartbeat_png_bytes"] = f.read()

    def get_heartbeat_image(self, region_id: str) -> Optional[bytes]:
        region_data = self.cache.get(region_id)
        if region_data and "heartbeat_png_bytes" in region_data:
            return region_data["heartbeat_png_bytes"]
        return None

    def query_point(self, region_id: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        if region_id not in self.cache or region_id not in REGIONS:
            return None
            
        region_cfg = REGIONS[region_id]
        data = self.cache[region_id]
        
        min_lon, min_lat, max_lon, max_lat = region_cfg.bounds
        
        # Clamp coordinates to bounds
        if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
            # Clamp to nearest valid edge coordinate
            lat = max(min_lat, min(max_lat, lat))
            lon = max(min_lon, min(max_lon, lon))
            
        lats = data["lats"]
        lons = data["lons"]
        
        # Find nearest row and column
        # lats are ordered north to south (descending)
        row = int(np.clip(int(np.argmin(np.abs(lats - lat))), 0, len(lats) - 1))
        col = int(np.clip(int(np.argmin(np.abs(lons - lon))), 0, len(lons) - 1))
        
        copol_series = [float(v) for v in data["copol_stack"][:, row, col]]
        crosspol_series = [float(v) for v in data["crosspol_stack"][:, row, col]]
        dates = data["dates"]
        doys = data["doys"]
        
        # Compute harmonic regression for this pixel
        harmonic = fit_first_order_harmonic(np.array(doys), np.array(copol_series))
        
        # Generate sonification profile & acoustic archetype
        sonification = calculate_sonification_profile(
            dates=dates,
            doys=doys,
            copol_db=copol_series,
            crosspol_db=crosspol_series,
            harmonic=harmonic
        )
        
        # Construct response time-series
        time_series = []
        omega = 2.0 * np.pi / 365.0
        for d, doy, cp, xp in zip(dates, doys, copol_series, crosspol_series):
            fitted_val = harmonic["a0"] + harmonic["a1"] * np.cos(omega * doy) + harmonic["b1"] * np.sin(omega * doy)
            time_series.append({
                "date": str(d),
                "doy": int(doy),
                "copol_dB": round(float(cp), 2),
                "crosspol_dB": round(float(xp), 2),
                "ratio_dB": round(float(cp - xp), 2),
                "fitted_dB": round(float(fitted_val), 2)
            })
            
        return {
            "region": region_id,
            "coordinates": {
                "lat": round(float(lats[row]), 5),
                "lon": round(float(lons[col]), 5),
                "queried_lat": round(lat, 5),
                "queried_lon": round(lon, 5)
            },
            "harmonic": harmonic,
            "classification": sonification["classification"],
            "sonification": {
                "base_frequency_hz": sonification["base_frequency_hz"],
                "tempo_bpm": sonification["tempo_bpm"],
                "duration_seconds": sonification["duration_seconds"],
                "note_events": sonification["note_events"]
            },
            "time_series": time_series
        }
