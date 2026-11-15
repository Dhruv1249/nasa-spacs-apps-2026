#!/usr/bin/env python3
"""
Single-Scene Earth Engine Download & Validation Test
Fetches and validates 1 real Sentinel-1 scene from Google Earth Engine for:
1. Sacramento Valley, California
2. Punjab, India
"""

import os
import sys
import json
import urllib.request
import numpy as np

def init_gee():
    import ee
    import glob
    
    # Auto-detect ADC credentials from gcloud config if not explicitly set
    if "GOOGLE_APPLICATION_CREDENTIALS" not in os.environ:
        legacy_adcs = glob.glob(os.path.expanduser("~/.config/gcloud/legacy_credentials/*/adc.json"))
        if legacy_adcs:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = legacy_adcs[0]
            
    proj = os.environ.get("EE_PROJECT_ID") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    if not proj:
        # Try reading from gcloud config
        cfg_path = os.path.expanduser("~/.config/gcloud/configurations/config_default")
        if os.path.exists(cfg_path):
            with open(cfg_path) as f:
                for line in f:
                    if line.strip().startswith("project ="):
                        proj = line.split("=")[1].strip()
                        break

    try:
        if proj:
            ee.Initialize(project=proj)
            print(f"✅ Earth Engine initialized with project: {proj}")
        else:
            ee.Initialize()
            print("✅ Earth Engine initialized with default credentials")
        return ee
    except Exception as e:
        print(f"EE Init Error: {e}")
        print("Please export your project: export EE_PROJECT_ID=your-project-id")
        sys.exit(1)

def test_download_single_scene(region_id: str, out_dir: str = "backend/app/data"):
    ee = init_gee()
    
    if region_id == "sacramento":
        coords = [[-121.90, 38.68], [-121.55, 38.68], [-121.55, 38.98], [-121.90, 38.98], [-121.90, 38.68]]
        name = "Sacramento Valley, California"
        # Test during May 2024 (Rice flooding season)
        date_start = "2024-05-01"
        date_end = "2024-05-31"
    else:
        coords = [[75.70, 30.75], [76.05, 30.75], [76.05, 31.05], [75.70, 31.05], [75.70, 30.75]]
        name = "Indo-Gangetic Plain, Punjab"
        # Test during September 2024 (Kharif rice peak)
        date_start = "2024-09-01"
        date_end = "2024-09-30"

    aoi = ee.Geometry.Polygon([coords])
    
    print("=" * 75)
    print(f"🛰️  TESTING GEE DOWNLOAD: {name.upper()}")
    print("=" * 75)
    
    # Query single scene
    col = (ee.ImageCollection('COPERNICUS/S1_GRD')
           .filterBounds(aoi)
           .filterDate(date_start, date_end)
           .filter(ee.Filter.eq('instrumentMode', 'IW'))
           .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
           .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
           .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
           .select(['VV', 'VH']))
           
    count = col.size().getInfo()
    print(f"Found {count} scenes in window {date_start} to {date_end}.")
    
    if count == 0:
        print("No ascending scene found in window, taking latest available ascending scene...")
        col = (ee.ImageCollection('COPERNICUS/S1_GRD')
               .filterBounds(aoi)
               .filter(ee.Filter.eq('instrumentMode', 'IW'))
               .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
               .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
               .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
               .select(['VV', 'VH'])
               .sort('system:time_start', False))
               
    scene = col.first()
    scene_id = scene.get('system:index').getInfo()
    scene_date = ee.Date(scene.get('system:time_start')).format('YYYY-MM-dd HH:mm:ss').getInfo()
    
    print(f"• Scene ID:   {scene_id}")
    print(f"• Acquisition Date: {scene_date}")
    
    # Clip to our exact study bounding box
    clipped = scene.clip(aoi)
    
    # Compute basic stats over AOI
    stats = clipped.reduceRegion(
        reducer=ee.Reducer.mean().combine(
            reducer2=ee.Reducer.minMax(),
            sharedInputs=True
        ),
        geometry=aoi,
        scale=100,
        maxPixels=1e8
    ).getInfo()
    
    vv_mean = stats.get('VV_mean')
    vv_min = stats.get('VV_min')
    vv_max = stats.get('VV_max')
    
    vh_mean = stats.get('VH_mean')
    vh_min = stats.get('VH_min')
    vh_max = stats.get('VH_max')
    
    print(f"\n📊 Physics Validation for {name}:")
    print(f"  • VV Backscatter (dB): Mean = {vv_mean:.2f} dB [Min = {vv_min:.2f} dB, Max = {vv_max:.2f} dB]")
    print(f"  • VH Backscatter (dB): Mean = {vh_mean:.2f} dB [Min = {vh_min:.2f} dB, Max = {vh_max:.2f} dB]")
    print(f"  • Dual-Pol Ratio:      Mean = {(vv_mean - vh_mean):.2f} dB")
    
    # Verify values are in expected radar physical limits
    assert -30 <= vv_mean <= 0, f"Unexpected VV mean: {vv_mean}"
    assert -35 <= vh_mean <= -5, f"Unexpected VH mean: {vh_mean}"
    print("✅ Radar Physics Check: PASS (Values strictly within expected SAR backscatter ranges)")
    
    # Download single GeoTIFF directly from Earth Engine
    print(f"\n⬇️  Generating direct Earth Engine download URL (at 50m resolution for fast test)...")
    download_url = clipped.getDownloadURL({
        'scale': 50,
        'crs': 'EPSG:4326',
        'region': aoi,
        'format': 'GEO_TIFF'
    })
    
    target_dir = os.path.join(out_dir, region_id)
    os.makedirs(target_dir, exist_ok=True)
    tif_path = os.path.join(target_dir, f"{region_id}_gee_single.tif")
    
    print(f"Downloading GeoTIFF from Earth Engine cloud...")
    urllib.request.urlretrieve(download_url, tif_path)
    file_size_mb = os.path.getsize(tif_path) / (1024 * 1024)
    print(f"✅ Successfully downloaded GeoTIFF: {tif_path} ({file_size_mb:.2f} MB)")
    print("=" * 75 + "\n")
    
    return {
        "region": region_id,
        "scene_id": scene_id,
        "date": scene_date,
        "vv_mean": vv_mean,
        "vh_mean": vh_mean,
        "file_size_mb": file_size_mb,
        "path": tif_path
    }

if __name__ == "__main__":
    reg = sys.argv[1] if len(sys.argv) > 1 else "both"
    if reg == "both":
        test_download_single_scene("sacramento")
        test_download_single_scene("punjab")
    else:
        test_download_single_scene(reg)
