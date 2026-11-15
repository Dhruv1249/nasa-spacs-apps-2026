import os
from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional

from app.config import REGIONS
from app.services.data_loader import SARDataLoader

app = FastAPI(
    title="NASA Land Heartbeat & Sound of the Land API",
    description="SAR Radar Time Series & Harmonic Sonification Engine (NISAR / Sentinel-1 / UAVSAR)",
    version="1.0.0"
)

# Enable CORS for Next.js frontend (local dev & Vercel production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_ROOT = os.path.join(os.path.dirname(__file__), "data")
data_loader = SARDataLoader(data_root=DATA_ROOT)

@app.get("/")
def root():
    return {
        "project": "Land Heartbeat & Sound of the Land",
        "author": "Antigravity Pair Programming for NASA Space Apps",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": [
            "/api/health",
            "/api/regions",
            "/api/heartbeat/{region}/image.png",
            "/api/point?region=sacramento&lat=38.83&lon=-121.72"
        ]
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "regions_loaded": list(data_loader.cache.keys())
    }

@app.get("/api/regions")
def get_regions():
    return {
        "regions": [r.dict() for r in REGIONS.values()]
    }

@app.get("/api/heartbeat/{region}/image.png")
def get_heartbeat_image(region: str, frame: Optional[str] = Query(None)):
    if region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Region '{region}' not found")
        
    png_bytes = data_loader.get_heartbeat_image(region, frame=frame)
    if not png_bytes:
        raise HTTPException(status_code=404, detail="Heartbeat image not found for region")
        
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={"Cache-Control": "no-cache, must-revalidate"}
    )

@app.get("/api/point")
def get_point_data(
    region: str = Query(..., description="Region ID: sacramento or punjab"),
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude")
):
    if region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Region '{region}' not found. Available: {list(REGIONS.keys())}")
        
    result = data_loader.query_point(region, lat, lon)
    if not result:
        raise HTTPException(status_code=400, detail="Could not retrieve point data for given coordinates.")
        
    return result
