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
                from scripts.generate_decadal_timelapse_frames import generate_region_gee_products
                generate_region_gee_products(region_id, width=400, height=400)

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

            decadal_path = os.path.join(region_dir, "decadal_timeseries.json")
            if os.path.exists(decadal_path):
                import json
                with open(decadal_path) as f:
                    self.cache[region_id]["decadal_data"] = json.load(f)

    def get_heartbeat_image(self, region_id: str, frame: Optional[str] = None) -> Optional[bytes]:
        region_dir = os.path.join(self.data_root, region_id)
        if frame:
            frame_clean = frame.replace(".png", "")
            
            # 1. Check decadal_frames subdirectory (244 individual calibrated frames)
            decadal_subpath = os.path.join(region_dir, "decadal_frames", f"{frame_clean}.png")
            if os.path.exists(decadal_subpath):
                with open(decadal_subpath, "rb") as f:
                    return f.read()

            # 2. Check frames subdirectory for seasonal & climate anomaly sequence
            frame_subpath = os.path.join(region_dir, "frames", f"{frame_clean}.png")
            if os.path.exists(frame_subpath):
                with open(frame_subpath, "rb") as f:
                    return f.read()

            frame_map = {
                "spring": "heartbeat_spring_flood.png",
                "summer": "heartbeat_summer_peak.png",
                "autumn": "heartbeat_autumn_harvest.png",
                "drought": "heartbeat_drought.png",
            }
            fname = frame_map.get(frame)
            if fname:
                fpath = os.path.join(region_dir, fname)
                if os.path.exists(fpath):
                    with open(fpath, "rb") as f:
                        return f.read()

        region_data = self.cache.get(region_id)
        if region_data and "heartbeat_png_bytes" in region_data:
            return region_data["heartbeat_png_bytes"]
        
        default_path = os.path.join(region_dir, "heartbeat.png")
        if os.path.exists(default_path):
            with open(default_path, "rb") as f:
                return f.read()
        return None

    def query_point(self, region_id: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        if region_id not in self.cache or region_id not in REGIONS:
            return None
            
        region_cfg = REGIONS[region_id]
        data = self.cache[region_id]
        
        min_lon, min_lat, max_lon, max_lat = region_cfg.bounds
        
        # Check if coordinates are within the SAR coverage footprint
        if not (min_lat <= lat <= max_lat and min_lon <= lon <= max_lon):
            lon_label = f"{abs(lon):.3f}°W" if lon < 0 else f"{lon:.3f}°E"
            return {
                "region": region_id,
                "is_out_of_bounds": True,
                "coordinates": {
                    "lat": lat,
                    "lon": lon,
                    "queried_lat": lat,
                    "queried_lon": lon
                },
                "bounds": list(region_cfg.bounds),
                "message": f"Clicked coordinate ({lat:.3f}°N, {lon_label}) is outside the Sentinel-1 study area for {region_cfg.name}. Click inside the cyan radar box or select an acoustic preset above."
            }
            
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
        if region_id == "punjab":
            from app.services.sar_processor import fit_second_order_harmonic
            h2 = fit_second_order_harmonic(np.array(doys), np.array(copol_series))
            max_amp = max(h2["amp1"], h2["amp2"])
            harmonic = {
                "a0": h2["a0"],
                "a1": h2.get("amp1", 0.0),
                "b1": 0.0,
                "amplitude": max_amp,
                "phase_rad": (h2["phase1_doy"] / 365.25) * 2.0 * np.pi,
                "phase_doy": h2["phase1_doy"],
                "r_squared": h2["r_squared"]
            }
            omega = 2.0 * np.pi / 365.25
            c1_arr = np.cos(omega * np.array(doys))
            c2_arr = np.cos(2.0 * omega * np.array(doys))
            fitted_curve = h2["a0"] + h2["amp1"] * c1_arr + h2["amp2"] * c2_arr
        else:
            harmonic = fit_first_order_harmonic(np.array(doys), np.array(copol_series))
            omega = 2.0 * np.pi / 365.0
            fitted_curve = [
                harmonic["a0"] + harmonic["a1"] * np.cos(omega * d) + harmonic["b1"] * np.sin(omega * d)
                for d in doys
            ]
        
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
        for i, (d, doy, cp, xp) in enumerate(zip(dates, doys, copol_series, crosspol_series)):
            time_series.append({
                "date": str(d),
                "doy": int(doy),
                "copol_dB": round(float(cp), 2),
                "crosspol_dB": round(float(xp), 2),
                "ratio_dB": round(float(cp - xp), 2),
                "fitted_dB": round(float(fitted_curve[i]), 2)
            })
            
        # Check for 10-Year Decadal data
        decadal_series = []
        decadal_sonification = None
        if "decadal_data" in data:
            decadal_dict = data["decadal_data"]
            # Map archetype or pick matching site
            archetype_key = None
            if "Rice" in sonification["classification"]["type"]:
                archetype_key = [k for k in decadal_dict if "Rice" in k or "Wheat-Rice" in k]
            elif "Water" in sonification["classification"]["type"]:
                archetype_key = [k for k in decadal_dict if "River" in k]
            elif "Orchard" in sonification["classification"]["type"] or "Forest" in sonification["classification"]["type"]:
                archetype_key = [k for k in decadal_dict if "Orchard" in k or "Canal" in k]
            elif "Urban" in sonification["classification"]["type"]:
                archetype_key = [k for k in decadal_dict if "Urban" in k]

            chosen_key = archetype_key[0] if (archetype_key and len(archetype_key) > 0) else list(decadal_dict.keys())[0]
            site_data = decadal_dict[chosen_key]
            
            dec_dates = site_data.get("dates", [])
            dec_vv = site_data.get("vv_db", [])
            dec_vh = site_data.get("vh_db", [])
            dec_ratio = site_data.get("ratio_db", [])
            
            dec_notes = []
            for dd, v, h, r in zip(dec_dates, dec_vv, dec_vh, dec_ratio):
                decadal_series.append({
                    "date": dd,
                    "doy": int(dd.split("-")[1]) * 30 + int(dd.split("-")[2]),
                    "copol_dB": v,
                    "crosspol_dB": h,
                    "ratio_dB": r,
                    "fitted_dB": v
                })
                norm_bio = float(np.clip((h + 28.0) / 18.0, 0.0, 1.0))
                freq = round(140.0 + (norm_bio ** 1.5) * 520.0, 1)
                gain = round(float(np.clip((v + 26.0) / 22.0, 0.05, 0.95)), 3)
                cutoff = round(250.0 + (norm_bio ** 1.2) * 2950.0, 1)
                dec_notes.append({
                    "date": dd,
                    "doy": 0,
                    "frequency_hz": freq,
                    "gain": gain,
                    "filter_cutoff_hz": cutoff,
                    "copol_db": v,
                    "crosspol_db": h,
                    "ratio_db": r
                })
                
            decadal_sonification = {
                "site_name": chosen_key,
                "total_epochs": len(dec_dates),
                "tempo_bpm": 180,
                "duration_seconds": 22.0,
                "note_events": dec_notes
            }

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
            "time_series": time_series,
            "decadal_time_series": decadal_series,
            "decadal_sonification": decadal_sonification
        }
