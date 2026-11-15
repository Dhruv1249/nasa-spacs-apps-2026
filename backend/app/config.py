from dataclasses import dataclass, asdict
from typing import List, Dict, Any

@dataclass
class RegionConfig:
    id: str
    name: str
    country: str
    center: List[float]  # [lon, lat]
    zoom: int
    bounds: List[float]  # [min_lon, min_lat, max_lon, max_lat]
    primary_crop: str
    radar_bands: List[str]
    description: str

    def dict(self) -> Dict[str, Any]:
        return asdict(self)

REGIONS: Dict[str, RegionConfig] = {
    "sacramento": RegionConfig(
        id="sacramento",
        name="Sacramento Valley, California",
        country="USA",
        center=[-121.72, 38.83],
        zoom=11,
        bounds=[-121.90, 38.68, -121.55, 38.98],
        primary_crop="Single-Cycle Flooded Rice & Walnut Orchards",
        radar_bands=["L-band (NISAR/UAVSAR)", "C-band (Sentinel-1)"],
        description="Features spring field flooding (radar specular drop), explosive summer greening, and autumn harvest."
    ),
    "punjab": RegionConfig(
        id="punjab",
        name="Indo-Gangetic Plain, Punjab",
        country="India",
        center=[75.85, 30.90],
        zoom=11,
        bounds=[75.70, 30.75, 76.05, 31.05],
        primary_crop="Kharif (Rice) - Rabi (Wheat) Dual Rotation",
        radar_bands=["L-band (NISAR)", "C-band (Sentinel-1)"],
        description="Core NASA-ISRO Cal/Val agricultural belt with two distinct seasonal heartbeats per year."
    )
}
