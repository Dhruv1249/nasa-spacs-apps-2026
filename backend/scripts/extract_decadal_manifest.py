#!/usr/bin/env python3
"""
Decadal Sentinel-1 Time Series Manifest Generator
Generates the 2-scenes-per-month sampling schedule (240 epochs) from Nov 15, 2016 to Nov 15, 2026
for both Sacramento Valley (California) and Punjab (India).
"""

import os
import sys
import json
import urllib.parse
import urllib.request
from datetime import datetime, timedelta

REGIONS = {
    "sacramento": {
        "name": "Sacramento Valley, California",
        "wkt": "POLYGON((-121.90 38.68,-121.55 38.68,-121.55 38.98,-121.90 38.98,-121.90 38.68))",
        "flight_direction": "ASCENDING"
    },
    "punjab": {
        "name": "Indo-Gangetic Plain, Punjab",
        "wkt": "POLYGON((75.70 30.75,76.05 30.75,76.05 31.05,75.70 31.05,75.70 30.75))",
        "flight_direction": "ASCENDING"
    }
}

def generate_2_per_month_intervals(start_year=2016, end_year=2026):
    """Generates 240 bi-weekly search intervals across the 10-year span."""
    intervals = []
    
    # 2016 starts Nov 15
    intervals.append(("2016-11-15", "2016-11-30"))
    intervals.append(("2016-12-01", "2016-12-15"))
    intervals.append(("2016-12-16", "2016-12-31"))
    
    for year in range(2017, 2026):
        for month in range(1, 13):
            # Window 1: Day 1 to 15
            intervals.append((f"{year}-{month:02d}-01", f"{year}-{month:02d}-15"))
            # Window 2: Day 16 to end of month
            last_day = 28 if month == 2 else (30 if month in [4, 6, 9, 11] else 31)
            intervals.append((f"{year}-{month:02d}-16", f"{year}-{month:02d}-{last_day}"))
            
    # 2026 up to Nov 15
    for month in range(1, 11):
        intervals.append((f"2026-{month:02d}-01", f"2026-{month:02d}-15"))
        last_day = 28 if month == 2 else (30 if month in [4, 6, 9, 11] else 31)
        intervals.append((f"2026-{month:02d}-16", f"2026-{month:02d}-{last_day}"))
    intervals.append(("2026-11-01", "2026-11-15"))
    
    return intervals

def query_asf_for_intervals(region_id: str, intervals, max_samples: int = None):
    reg = REGIONS[region_id]
    base_url = "https://api.daac.asf.alaska.edu/services/search/param"
    
    selected_scenes = []
    print(f"\nScanning {len(intervals)} bi-weekly intervals for {reg['name']}...")
    
    to_process = intervals[:max_samples] if max_samples else intervals
    for idx, (s_date, e_date) in enumerate(to_process):
        params = {
            "dataset": "SENTINEL-1",
            "intersectsWith": reg["wkt"],
            "start": s_date + "T00:00:00Z",
            "end": e_date + "T23:59:59Z",
            "processingLevel": "GRD_HD",
            "flightDirection": reg["flight_direction"],
            "output": "json",
            "maxResults": 1
        }
        url = f"{base_url}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers={"User-Agent": "LandHeartbeat/1.0"})
        
        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                data = json.loads(response.read().decode())
                granules = data[0] if data and isinstance(data[0], list) else data
                if granules:
                    g = granules[0]
                    scene_info = {
                        "interval_index": idx + 1,
                        "window": f"{s_date} to {e_date}",
                        "scene_name": g.get("sceneName"),
                        "acquisition_time": g.get("startTime"),
                        "polarization": g.get("polarization"),
                        "download_url": g.get("url"),
                        "size_mb": float(g.get("sizeMB", 0.0))
                    }
                    selected_scenes.append(scene_info)
                    print(f"[{idx+1}/{len(to_process)}] {s_date[:7]}: {g.get('startTime')[:10]} ({scene_info['size_mb']:.1f} MB)")
                else:
                    print(f"[{idx+1}/{len(to_process)}] {s_date[:7]}: No ascending granule in window")
        except Exception as err:
            print(f"[{idx+1}/{len(to_process)}] {s_date[:7]}: Query error: {err}")
            
    return selected_scenes

if __name__ == "__main__":
    intervals = generate_2_per_month_intervals()
    print(f"Generated {len(intervals)} bi-weekly intervals across 10 years (2016-11-15 to 2026-11-15).")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--query":
        # Run query for first 5 intervals as demonstration
        scenes = query_asf_for_intervals("sacramento", intervals, max_samples=5)
        out_file = "sacramento_10yr_sample_manifest.json"
        with open(out_file, "w") as f:
            json.dump(scenes, f, indent=2)
        print(f"\nSaved sample manifest to {out_file}")
    else:
        print("\nTo query ASF CMR API directly for scenes, run:")
        print("  python3 backend/scripts/extract_decadal_manifest.py --query")
