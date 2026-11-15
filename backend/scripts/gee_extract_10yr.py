#!/usr/bin/env python3
"""
Google Earth Engine (GEE) 10-Year Decadal Sentinel-1 Extractor
Extracts bi-weekly composites (up to 240 epochs) across 2016-11-15 to 2026-11-15
for Sacramento Valley (California) and Punjab (India).

Usage:
  python gee_extract_10yr.py sacramento --project YOUR_PROJECT_ID
  python gee_extract_10yr.py punjab --project YOUR_PROJECT_ID --years 5
"""

import os
import sys
import time
import json
import argparse
from datetime import datetime, timedelta

def format_duration(seconds: float) -> str:
    """Formats seconds into MM:SS or HH:MM:SS."""
    m, s = divmod(int(seconds), 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"

def init_gee(project_id: str = None):
    """Initializes Earth Engine using user-supplied project or gcloud defaults."""
    import ee
    
    # Priority: 1. CLI arg -> 2. Environment variable -> 3. None (gcloud default)
    proj = project_id or os.environ.get("EE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    
    print("=" * 75)
    print(" 🛰️  GOOGLE EARTH ENGINE INITIALIZATION")
    print("=" * 75)
    
    try:
        if proj:
            print(f"Connecting to Earth Engine with Project: {proj}...")
            ee.Initialize(project=proj)
        else:
            print("Connecting to Earth Engine with default gcloud credentials...")
            ee.Initialize()
        print("✅ Earth Engine initialized successfully!\n")
        return ee
    except Exception as e:
        print(f"\n❌ Error initializing Earth Engine: {e}")
        print("\nTroubleshooting tips:")
        print("  1. Pass your project explicitly: --project YOUR_GCP_PROJECT_ID")
        print("  2. Or set it in your terminal:   export EE_PROJECT_ID=YOUR_GCP_PROJECT_ID")
        print("  3. Ensure you have authorized:   earthengine authenticate")
        sys.exit(1)

def get_key_points(ee, region_id: str):
    """Returns characteristic land cover test points for sonification time-series."""
    if region_id == "sacramento":
        return {
            "Rice Basin (Sutter)": ee.Geometry.Point([-121.725, 38.835]),
            "Sacramento River": ee.Geometry.Point([-121.685, 38.805]),
            "Walnut Orchard": ee.Geometry.Point([-121.780, 38.740]),
            "Urban Infrastructure": ee.Geometry.Point([-121.770, 38.695])
        }
    else: # punjab
        return {
            "Wheat-Rice Field": ee.Geometry.Point([75.830, 30.910]),
            "Sutlej River": ee.Geometry.Point([75.860, 30.980]),
            "Canal Irrigation": ee.Geometry.Point([75.760, 30.840]),
            "Urban Center": ee.Geometry.Point([75.920, 30.895])
        }

def get_aoi_geometry(ee, region_id: str):
    if region_id == "sacramento":
        coords = [[-121.90, 38.68], [-121.55, 38.68], [-121.55, 38.98], [-121.90, 38.98], [-121.90, 38.68]]
    else: # punjab
        coords = [[75.70, 30.75], [76.05, 30.75], [76.05, 31.05], [75.70, 31.05], [75.70, 30.75]]
    return ee.Geometry.Polygon([coords])

def extract_time_series(region_id: str, project_id: str = None, sample_years: int = None):
    ee = init_gee(project_id)
    aoi = get_aoi_geometry(ee, region_id)
    key_points = get_key_points(ee, region_id)
    
    start_year = 2017
    end_year = 2026 if not sample_years else min(2026, start_year + sample_years)
    
    # Generate bi-weekly date windows
    intervals = []
    for y in range(start_year, end_year):
        for m in range(1, 13):
            intervals.append((f"{y}-{m:02d}-01", f"{y}-{m:02d}-15", f"{y}-{m:02d}-07"))
            last_day = 28 if m == 2 else (30 if m in [4, 6, 9, 11] else 31)
            intervals.append((f"{y}-{m:02d}-16", f"{y}-{m:02d}-{last_day}", f"{y}-{m:02d}-23"))

    total_steps = len(intervals)
    years_span = end_year - start_year
    
    print("=" * 75)
    print(f" 📈 TIME SERIES EXTRACTION FOR {region_id.upper()}")
    print("=" * 75)
    print(f"• Temporal Range:     {start_year}-01-01 to {end_year}-12-31 ({years_span} years)")
    print(f"• Total Epochs:       {total_steps} bi-weekly steps")
    print(f"• Sampling Locations: {len(key_points)} sites ({', '.join(key_points.keys())})")
    print("=" * 75)
    print("Starting extraction... Press Ctrl+C at any time to safely halt.\n")

    base_col = (ee.ImageCollection('COPERNICUS/S1_GRD')
                .filterBounds(aoi)
                .filter(ee.Filter.eq('instrumentMode', 'IW'))
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
                .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
                .select(['VV', 'VH']))

    results = {name: {"dates": [], "vv_db": [], "vh_db": [], "ratio_db": []} for name in key_points}
    
    start_time = time.time()
    
    for idx, (s_date, e_date, mid_date) in enumerate(intervals):
        step_start = time.time()
        window_col = base_col.filterDate(s_date, e_date)
        window_mean = window_col.mean()
        
        valid_samples = 0
        for name, pt in key_points.items():
            try:
                sampled = window_mean.reduceRegion(
                    reducer=ee.Reducer.first(),
                    geometry=pt,
                    scale=20
                ).getInfo()
                
                vv = sampled.get('VV')
                vh = sampled.get('VH')
                
                if vv is not None and vh is not None:
                    vv_db = float(vv)
                    vh_db = float(vh)
                    results[name]["dates"].append(mid_date)
                    results[name]["vv_db"].append(round(vv_db, 2))
                    results[name]["vh_db"].append(round(vh_db, 2))
                    results[name]["ratio_db"].append(round(vv_db - vh_db, 2))
                    valid_samples += 1
            except Exception:
                pass

        elapsed = time.time() - start_time
        avg_per_step = elapsed / (idx + 1)
        remaining = avg_per_step * (total_steps - (idx + 1))
        percent = ((idx + 1) / total_steps) * 100.0

        # Progress log with timer
        print(f"[{format_duration(elapsed)} / ETA: {format_duration(remaining)}] "
              f"Step {idx + 1:03d}/{total_steps:03d} ({percent:4.1f}%) | "
              f"Window: {s_date} -> {e_date} | Sampled: {valid_samples}/{len(key_points)} sites")

    total_duration = time.time() - start_time
    print("\n" + "=" * 75)
    print(f"🎉 EXTRACTION COMPLETE in {format_duration(total_duration)}!")
    print("=" * 75)

    # Save to disk
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "data", region_id))
    os.makedirs(out_dir, exist_ok=True)
    out_json = os.path.join(out_dir, "decadal_timeseries.json")
    
    with open(out_json, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"Saved dataset: {out_json}")
    for name, data in results.items():
        print(f"  • {name}: {len(data['dates'])} valid satellite acquisitions")

def main():
    parser = argparse.ArgumentParser(description="Extract 10-Year Sentinel-1 decadal series from Google Earth Engine")
    parser.add_argument("region", choices=["sacramento", "punjab"], default="sacramento", nargs="?",
                        help="Target region: sacramento or punjab (default: sacramento)")
    parser.add_argument("--project", type=str, default=None,
                        help="Google Cloud project ID with Earth Engine enabled (or set EE_PROJECT_ID env var)")
    parser.add_argument("--years", type=int, default=None,
                        help="Number of years to extract (default: full decade up to 2026)")
    args = parser.parse_args()

    extract_time_series(args.region, project_id=args.project, sample_years=args.years)

if __name__ == "__main__":
    main()
