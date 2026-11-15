#!/usr/bin/env python3
"""
Google Earth Engine (GEE) 10-Year Decadal Sentinel-1 Extractor
Extracts 2-scenes-per-month (240 epochs) from 2016-11-15 to 2026-11-15
for Sacramento Valley, California and Punjab, India.
"""

import os
import sys
import json
import numpy as np
from datetime import datetime, timedelta

def check_gee_auth():
    """Verifies that Earth Engine is authenticated."""
    try:
        import ee
        ee.Initialize()
        print("✅ Google Earth Engine initialized and authenticated successfully!")
        return True, ee
    except Exception as e:
        print("\n⚠️  Earth Engine is not initialized/authenticated yet.")
        print(f"Error: {e}\n")
        print("To authenticate, run these two commands in your terminal:")
        print("  source backend/.venv/bin/activate")
        print("  earthengine authenticate")
        print("\nThis will open a browser window to link your Google Cloud / Earth Engine account.")
        return False, None

def get_aoi_geometry(ee, region_id: str):
    if region_id == "sacramento":
        # min_lon, min_lat, max_lon, max_lat = -121.90, 38.68, -121.55, 38.98
        coords = [[-121.90, 38.68], [-121.55, 38.68], [-121.55, 38.98], [-121.90, 38.98], [-121.90, 38.68]]
    else: # punjab
        # min_lon, min_lat, max_lon, max_lat = 75.70, 30.75, 76.05, 31.05
        coords = [[75.70, 30.75], [76.05, 30.75], [76.05, 31.05], [75.70, 31.05], [75.70, 30.75]]
    return ee.Geometry.Polygon([coords])

def query_s1_collection(ee, aoi, start_date="2016-11-15", end_date="2026-11-15"):
    """Creates filtered Sentinel-1 GRD collection."""
    s1 = (ee.ImageCollection('COPERNICUS/S1_GRD')
          .filterBounds(aoi)
          .filterDate(start_date, end_date)
          .filter(ee.Filter.eq('instrumentMode', 'IW'))
          .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
          .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
          .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING')))
    return s1

def run_extraction(region_id: str = "sacramento"):
    authed, ee = check_gee_auth()
    if not authed:
        sys.exit(1)
        
    aoi = get_aoi_geometry(ee, region_id)
    s1 = query_s1_collection(ee, aoi)
    total_count = s1.size().getInfo()
    print(f"\nFound {total_count:,} Sentinel-1 ascending scenes in GEE archive for {region_id} (2016-2026)!")
    
    # Example: Print first and last available dates
    first_scene = s1.first()
    first_date = ee.Date(first_scene.get('system:time_start')).format('YYYY-MM-dd').getInfo()
    print(f"Earliest available acquisition: {first_date}")
    
    print("\nNext step: You can export composite time-series directly to your Google Drive or compute regional arrays.")

if __name__ == "__main__":
    region = sys.argv[1] if len(sys.argv) > 1 else "sacramento"
    run_extraction(region)
