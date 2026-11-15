#!/usr/bin/env python3
"""
Sentinel-1 & NISAR ASF Vertex / Earthdata Query Tool
Supports:
1. 1-Year High-Cadence Seasonal Cycle (2024)
2. 10-Year Decadal Climate & Land Memory (2015 - 2024)
"""

import sys
import json
import urllib.parse

REGIONS_AOI = {
    "sacramento": {
        "name": "Sacramento Valley, California, USA",
        "wkt": "POLYGON((-121.90 38.68,-121.55 38.68,-121.55 38.98,-121.90 38.98,-121.90 38.68))",
        "start_date_1yr": "2024-01-01T00:00:00Z",
        "end_date_1yr": "2024-12-31T23:59:59Z",
        "start_date_10yr": "2015-01-01T00:00:00Z",
        "end_date_10yr": "2024-12-31T23:59:59Z",
        "granules_10yr": 1293,
        "dataset": "SENTINEL-1",
        "beam_mode": "IW",
        "polarization": "VV+VH",
        "processing_level": "GRD_HD"
    },
    "punjab": {
        "name": "Indo-Gangetic Plain, Punjab, India",
        "wkt": "POLYGON((75.70 30.75,76.05 30.75,76.05 31.05,75.70 31.05,75.70 30.75))",
        "start_date_1yr": "2024-01-01T00:00:00Z",
        "end_date_1yr": "2024-12-31T23:59:59Z",
        "start_date_10yr": "2015-01-01T00:00:00Z",
        "end_date_10yr": "2024-12-31T23:59:59Z",
        "granules_10yr": 913,
        "dataset": "SENTINEL-1",
        "beam_mode": "IW",
        "polarization": "VV+VH",
        "processing_level": "GRD_HD"
    },
    "canada_boreal": {
        "name": "Northern Saskatchewan / Manitoba, Canada",
        "wkt": "POLYGON((-108.0612 55.4046,-94.9167 55.4046,-94.9167 56.2989,-108.0612 56.2989,-108.0612 55.4046))",
        "start_date_1yr": "2024-01-01T00:00:00Z",
        "end_date_1yr": "2024-12-31T23:59:59Z",
        "start_date_10yr": "2015-01-01T00:00:00Z",
        "end_date_10yr": "2024-12-31T23:59:59Z",
        "granules_10yr": 2042,
        "dataset": "SENTINEL-1",
        "beam_mode": "IW",
        "polarization": "VV+VH",
        "processing_level": "GRD_HD"
    }
}

def print_aoi_details():
    print("=" * 85)
    print(" 🛰️  SENTINEL-1 10-YEAR (2015-2024) & 1-YEAR (2024) EARTHDATA / ASF PARAMETERS")
    print("=" * 85)
    
    for key, info in REGIONS_AOI.items():
        encoded_polygon = urllib.parse.quote(info['wkt'])
        
        # 10-Year Link
        vertex_10yr = (
            f"https://search.asf.alaska.edu/#/?dataset={info['dataset']}"
            f"&polygon={encoded_polygon}"
            f"&start={info['start_date_10yr']}"
            f"&end={info['end_date_10yr']}"
            f"&beamMode={info['beam_mode']}"
            f"&processingLevel={info['processing_level']}"
        )
        
        print(f"\n📍 REGION: {info['name']} [{key}]")
        print("-" * 85)
        print(f"Area of Interest (WKT Polygon):\n{info['wkt']}\n")
        print(f"🗓️  10-Year Decadal Range: {info['start_date_10yr']} ➔ {info['end_date_10yr']}")
        print(f"   • Total Available Granules: {info['granules_10yr']:,} scenes")
        print(f"🗓️  1-Year Seasonal Range:  {info['start_date_10yr']} ➔ {info['end_date_1yr']}\n")
        print(f"1-Click 10-Year ASF Vertex Search:\n{vertex_10yr}\n")

if __name__ == "__main__":
    print_aoi_details()
