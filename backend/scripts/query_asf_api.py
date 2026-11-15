#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json
import sys

def search_asf_granules(wkt: str, start: str, end: str, max_results: int = 5):
    base_url = "https://api.daac.asf.alaska.edu/services/search/param"
    params = {
        "dataset": "SENTINEL-1",
        "intersectsWith": wkt,
        "start": start,
        "end": end,
        "processingLevel": "GRD_HD",
        "output": "json",
        "maxResults": max_results
    }
    
    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    print(f"Querying ASF CMR API:\n{url}\n")
    
    req = urllib.request.Request(url, headers={"User-Agent": "LandHeartbeat/1.0"})
    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.loads(response.read().decode())
        
    granules = data[0] if data and isinstance(data[0], list) else data
    print(f"Found {len(granules)} Sentinel-1 scenes:")
    for g in granules[:5]:
        scene_name = g.get("sceneName", "N/A")
        start_time = g.get("startTime", "N/A")
        beam_mode = g.get("beamMode", "N/A")
        polarization = g.get("polarization", "N/A")
        size_mb = float(g.get("sizeMB", 0.0))
        download_url = g.get("url", "N/A")
        print(f"• Scene: {scene_name}")
        print(f"  Acquisition: {start_time} | Polarizations: {polarization} | Size: {size_mb:.1f} MB")
        print(f"  URL: {download_url}\n")

if __name__ == "__main__":
    # Test with Sacramento AOI
    sac_wkt = "POLYGON((-121.90 38.68,-121.55 38.68,-121.55 38.98,-121.90 38.98,-121.90 38.68))"
    search_asf_granules(sac_wkt, "2024-05-01T00:00:00Z", "2024-06-01T23:59:59Z", max_results=3)
