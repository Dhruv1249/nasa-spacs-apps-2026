#!/usr/bin/env python3
"""
Sentinel-1 & NISAR ASF Vertex / Earthdata Query Tool
Provides WKT polygons, date filters, and programmatic search queries.
"""

import sys
import json
import urllib.parse

REGIONS_AOI = {
    "sacramento": {
        "name": "Sacramento Valley, California, USA",
        "wkt": "POLYGON((-121.90 38.68,-121.55 38.68,-121.55 38.98,-121.90 38.98,-121.90 38.68))",
        "start_date": "2024-01-01T00:00:00Z",
        "end_date": "2024-12-31T23:59:59Z",
        "dataset": "SENTINEL-1",
        "beam_mode": "IW",
        "polarization": "VV+VH",
        "processing_level": "GRD_HD"
    },
    "punjab": {
        "name": "Indo-Gangetic Plain, Punjab, India",
        "wkt": "POLYGON((75.70 30.75,76.05 30.75,76.05 31.05,75.70 31.05,75.70 30.75))",
        "start_date": "2024-01-01T00:00:00Z",
        "end_date": "2024-12-31T23:59:59Z",
        "dataset": "SENTINEL-1",
        "beam_mode": "IW",
        "polarization": "VV+VH",
        "processing_level": "GRD_HD"
    },
    "canada_boreal": {
        "name": "Northern Saskatchewan / Manitoba (User AOI)",
        "wkt": "POLYGON((-108.0612 55.4046,-94.9167 55.4046,-94.9167 56.2989,-108.0612 56.2989,-108.0612 55.4046))",
        "start_date": "2024-01-01T00:00:00Z",
        "end_date": "2024-12-31T23:59:59Z",
        "dataset": "SENTINEL-1",
        "beam_mode": "IW",
        "polarization": "VV+VH",
        "processing_level": "GRD_HD"
    }
}

def print_aoi_details():
    print("=" * 80)
    print(" EARTHDATA / ASF VERTEX SENTINEL-1 SEARCH PARAMETERS")
    print("=" * 80)
    
    for key, info in REGIONS_AOI.items():
        encoded_polygon = urllib.parse.quote(info['wkt'])
        vertex_url = (
            f"https://search.asf.alaska.edu/#/?dataset={info['dataset']}"
            f"&polygon={encoded_polygon}"
            f"&start={info['start_date']}"
            f"&end={info['end_date']}"
            f"&beamMode={info['beam_mode']}"
            f"&processingLevel={info['processing_level']}"
        )
        
        print(f"\n📍 REGION: {info['name']} [{key}]")
        print("-" * 80)
        print(f"Area of Interest (WKT Polygon):\n{info['wkt']}\n")
        print(f"Start Date: {info['start_date']}")
        print(f"End Date:   {info['end_date']}")
        print(f"Dataset:    {info['dataset']}")
        print(f"Beam Mode:  {info['beam_mode']}")
        print(f"Polarization: {info['polarization']}")
        print(f"Direct ASF Vertex 1-Click Link:\n{vertex_url}\n")

if __name__ == "__main__":
    print_aoi_details()
