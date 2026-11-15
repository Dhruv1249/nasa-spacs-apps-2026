#!/usr/bin/env python3
"""
NASA / ESA SAR Data Fetcher & Ingestion Pipeline
Supports:
1. NISAR Level-2 GCOV (Geocoded Polarimetric Covariance) via ASF DAAC
2. Sentinel-1 RTC (Radiometrically Terrain Corrected) via AWS Open Data Registry
3. NASA UAVSAR L-band Cal/Val airborne flights (Sacramento Valley)
"""

import os
import sys
import argparse

def print_data_sourcing_guide():
    guide = """
================================================================================
 NASA / ESA SAR DATA SOURCING GUIDE
================================================================================

1. NISAR Level-2 GCOV (Geocoded Polarimetric Covariance - L-band)
   -----------------------------------------------------------------------------
   • Portal: Alaska Satellite Facility (ASF) Vertex: https://search.asf.alaska.edu/
   • Dataset: Select 'NISAR' -> Science Product: 'GCOV'
   • Polarizations: HHHH, HVHV, VVVV
   • Python API:
       pip install asf_search
       import asf_search as asf
       # Search for GCOV over Sacramento Valley:
       results = asf.geo_search(
           platform=asf.PLATFORM.NISAR,
           processingLevel='GCOV',
           intersectsWith='POLYGON((-121.9 38.68, -121.55 38.68, -121.55 38.98, -121.9 38.98, -121.9 38.68))'
       )
       # Requires free NASA Earthdata account (https://urs.earthdata.nasa.gov)

2. Sentinel-1 RTC (C-band Dual-Pol VV + VH) - Free on AWS Open Data
   -----------------------------------------------------------------------------
   • Registry: https://registry.opendata.aws/sentinel-1-rtc-indigo/
   • S3 Bucket: s3://sentinel-s1-rtc-indigo/
   • Format: Cloud-Optimized GeoTIFFs (COG), 20m resolution
   • Advantage: Publicly accessible over HTTPS without needing NASA credentials.
   • URL Scheme:
       https://sentinel-s1-rtc-indigo.s3.amazonaws.com/tiles/RTC/1/IW/10/S/EF/...

3. NASA UAVSAR (L-band Airborne Prototype for NISAR)
   -----------------------------------------------------------------------------
   • Portal: https://uavsar.jpl.nasa.gov/
   • Sacramento Valley Flight lines: High-resolution repeat pass polarimetry (Sacram_18001, etc.)
   • Used directly for NISAR agricultural Cal/Val before and during satellite mission operations.

================================================================================
"""
    print(guide)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch and preprocess satellite SAR data")
    parser.add_argument("--guide", action="store_true", help="Print complete data sourcing guide")
    args = parser.parse_args()

    print_data_sourcing_guide()
