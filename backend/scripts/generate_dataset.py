import os
import sys
import numpy as np

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.sar_processor import harmonic_to_rgb
from app.services.image_utils import save_png

def generate_region_dataset(
    region_id: str,
    width: int = 500,
    height: int = 500,
    num_dates: int = 25,
    output_dir: str = "app/data"
):
    print(f"Generating realistic calibrated SAR radar stack for {region_id} ({width}x{height}, {num_dates} dates)...")
    
    # 25 dates throughout 1-year revisit cycle (~14 days apart)
    doys = np.linspace(15, 355, num_dates).astype(int)
    dates = [f"2025-{doy//30 + 1:02d}-{(doy % 28) + 1:02d}" for doy in doys]
    
    # Coordinate grids
    if region_id == "sacramento":
        min_lon, min_lat, max_lon, max_lat = -121.90, 38.68, -121.55, 38.98
    else:
        min_lon, min_lat, max_lon, max_lat = 75.70, 30.75, 76.05, 31.05
        
    lons = np.linspace(min_lon, max_lon, width)
    lats = np.linspace(max_lat, min_lat, height)
    xx, yy = np.meshgrid(np.linspace(0, 1, width), np.linspace(0, 1, height))
    
    rng = np.random.default_rng(42 if region_id == "sacramento" else 1337)
    
    # Spatial terrain synthesis
    # 1. Realistic meandering river channel
    if region_id == "sacramento":
        river_x = 0.44 + 0.08 * np.sin(yy * 3.2 * np.pi) + 0.04 * np.cos(yy * 6.5 * np.pi) + 0.02 * np.sin(yy * 12.0 * np.pi)
        river_dist = np.abs(xx - river_x)
        river_mask = river_dist < 0.018
        # Riparian forest corridor along river banks
        riparian_mask = (river_dist >= 0.018) & (river_dist < 0.038)
        
        # Rotated grid matching Sacramento Valley geological axis (~14 degrees)
        theta = np.radians(14)
        x_rot = xx * np.cos(theta) - yy * np.sin(theta)
        y_rot = xx * np.sin(theta) + yy * np.cos(theta)
        
        # Multi-scale rectangular agricultural parcels (typical 40-160 acre parcels)
        px = np.floor(x_rot * 32.0)
        py = np.floor(y_rot * 18.0)
        parcel_id = ((px * 43 + py * 89) % 23).astype(int)
        
        # Per-parcel planting offset (DOY shift between fields)
        parcel_offset = ((px * 17 + py * 31) % 25 - 12).astype(float)
    else:
        # Punjab: Sutlej river in the north, canal networks, smaller parcel sizes
        river_x = 0.50 + 0.15 * np.sin(yy * 2.8 * np.pi) + 0.03 * np.cos(yy * 5.0 * np.pi)
        river_dist = np.abs(xx - river_x)
        river_mask = river_dist < 0.022
        riparian_mask = (river_dist >= 0.022) & (river_dist < 0.040)
        
        # Dense smaller farm plots (intensive Punjab canal colonies)
        theta = np.radians(8)
        x_rot = xx * np.cos(theta) - yy * np.sin(theta)
        y_rot = xx * np.sin(theta) + yy * np.cos(theta)
        px = np.floor(x_rot * 45.0)
        py = np.floor(y_rot * 35.0)
        parcel_id = ((px * 37 + py * 71) % 29).astype(int)
        parcel_offset = ((px * 13 + py * 23) % 21 - 10).astype(float)

    # Road and ditch grid boundaries (subtle specular line features)
    road_x = (np.abs(x_rot * (32.0 if region_id == "sacramento" else 45.0) - px - 0.5) > 0.47)
    road_y = (np.abs(y_rot * (18.0 if region_id == "sacramento" else 35.0) - py - 0.5) > 0.47)
    boundary_mask = (road_x | road_y) & (~river_mask)

    # 3. Time series synthesis based on region phenology
    copol_stack = np.zeros((num_dates, height, width), dtype=np.float32)
    crosspol_stack = np.zeros((num_dates, height, width), dtype=np.float32)
    
    for t_idx, doy in enumerate(doys):
        # Effective DOY with realistic field-to-field planting variation
        eff_doy = np.clip(doy + parcel_offset, 1.0, 365.0)
        
        # Default pasture / fallow background
        cp = -15.0 + 2.5 * np.sin(2.0 * np.pi * (eff_doy - 120) / 365.0)
        xp = -23.0 + 2.0 * np.sin(2.0 * np.pi * (eff_doy - 120) / 365.0)
        
        copol = np.copy(cp).astype(np.float32)
        crosspol = np.copy(xp).astype(np.float32)
        
        if region_id == "sacramento":
            # 1. Flooded Rice Basins (Sutter Basin, Colusa, Natomas)
            rice_mask = (parcel_id < 14) & (~river_mask) & (~riparian_mask)
            
            # Vectorized piecewise rice phenology
            is_winter = eff_doy < 100
            is_flood = (eff_doy >= 100) & (eff_doy < 140)
            is_growth = (eff_doy >= 140) & (eff_doy < 240)
            is_mature = (eff_doy >= 240) & (eff_doy < 280)
            is_post = eff_doy >= 280
            
            growth_prog = (eff_doy - 140.0) / 100.0
            
            rice_cp = np.where(
                is_winter, -16.2,
                np.where(
                    is_flood, -22.5 + (eff_doy - 100.0) * 0.05,
                    np.where(
                        is_growth, -20.5 + growth_prog * 12.0,
                        np.where(is_mature, -9.0 - (eff_doy - 240.0) * 0.05, -17.0)
                    )
                )
            )
            rice_xp = np.where(
                is_winter, -24.0,
                np.where(
                    is_flood, -28.0,
                    np.where(
                        is_growth, -26.0 + growth_prog * 13.0,
                        np.where(is_mature, -13.5 - (eff_doy - 240.0) * 0.05, -25.0)
                    )
                )
            )
            copol[rice_mask] = rice_cp[rice_mask]
            crosspol[rice_mask] = rice_xp[rice_mask]
            
            # 2. Permanent Walnut & Almond Orchards (consistent high volume canopy)
            orchard_mask = ((parcel_id >= 14) & (parcel_id < 20)) & (~river_mask) & (~riparian_mask)
            copol[orchard_mask] = -10.5 + 1.2 * np.sin(2.0 * np.pi * (eff_doy[orchard_mask] - 150) / 365.0)
            crosspol[orchard_mask] = -15.8 + 1.0 * np.sin(2.0 * np.pi * (eff_doy[orchard_mask] - 150) / 365.0)
            
            # 3. Riparian tree buffer along Sacramento riverbank
            copol[riparian_mask] = -10.8 + 0.8 * np.sin(2.0 * np.pi * (doy - 160) / 365.0)
            crosspol[riparian_mask] = -15.2 + 0.9 * np.sin(2.0 * np.pi * (doy - 160) / 365.0)

            # 4. Built-up / Urban (Woodland, Yuba City cluster)
            urban_mask = (parcel_id >= 20) & (xx < 0.35) & (yy > 0.60) & (~river_mask)
            copol[urban_mask] = -6.5
            crosspol[urban_mask] = -13.0

        else: # Punjab (Intensive Kharif Rice + Rabi Wheat Dual Rotation)
            agri_mask = (parcel_id < 22) & (~river_mask) & (~riparian_mask)
            
            rabi_peak = 6.0 * np.exp(-((eff_doy - 70) ** 2) / (2 * (28 ** 2)))
            kharif_peak = 7.5 * np.exp(-((eff_doy - 245) ** 2) / (2 * (32 ** 2)))
            
            punjab_cp = -16.5 + rabi_peak + kharif_peak
            punjab_xp = -24.0 + (rabi_peak * 0.9) + (kharif_peak * 1.1)
            
            is_puddling = (eff_doy >= 150) & (eff_doy <= 175)
            punjab_cp = np.where(is_puddling, punjab_cp - 4.0, punjab_cp)
            punjab_xp = np.where(is_puddling, punjab_xp - 3.5, punjab_xp)
            
            copol[agri_mask] = punjab_cp[agri_mask]
            crosspol[agri_mask] = punjab_xp[agri_mask]
            
            # Riparian greenery along Sutlej River
            copol[riparian_mask] = -11.2 + 0.9 * np.sin(2.0 * np.pi * (doy - 230) / 365.0)
            crosspol[riparian_mask] = -16.0 + 0.8 * np.sin(2.0 * np.pi * (doy - 230) / 365.0)

            # Urban cluster (Ludhiana industrial corridors)
            urban_mask = (parcel_id >= 22) & (xx > 0.55) & (yy > 0.45) & (~river_mask)
            copol[urban_mask] = -5.8
            crosspol[urban_mask] = -12.0

        # Open water body (Specular radar drop)
        copol[river_mask] = -24.5
        crosspol[river_mask] = -30.0
        
        # Add realistic multiplicative SAR speckle (Rayleigh-like noise)
        speckle_cp = rng.normal(0.0, 0.55, (height, width)).astype(np.float32)
        speckle_xp = rng.normal(0.0, 0.65, (height, width)).astype(np.float32)
        
        copol_stack[t_idx] = copol + speckle_cp
        crosspol_stack[t_idx] = crosspol + speckle_xp

    # Vectorized Harmonic Fit across the entire spatial grid
    print(f"Computing vectorized harmonic regression for {width*height:,} pixels...")
    omega = 2.0 * np.pi / 365.0
    c_term = np.cos(omega * doys)[:, None, None]
    s_term = np.sin(omega * doys)[:, None, None]
    
    # Mean
    a0 = np.mean(copol_stack, axis=0)
    
    # 1st order Fourier coefficients
    a1 = 2.0 * np.mean((copol_stack - a0) * c_term, axis=0)
    b1 = 2.0 * np.mean((copol_stack - a0) * s_term, axis=0)
    
    amplitude = np.sqrt(a1**2 + b1**2)
    phase_rad = np.arctan2(b1, a1) % (2.0 * np.pi)
    
    # Convert Harmonic parameters to RGB Image
    print("Generating Land Heartbeat RGB visualization...")
    rgb_image = harmonic_to_rgb(phase_rad, amplitude, a0)
    
    # Save files
    target_dir = os.path.join(output_dir, region_id)
    os.makedirs(target_dir, exist_ok=True)
    
    # Save Image
    png_path = os.path.join(target_dir, "heartbeat.png")
    save_png(rgb_image, png_path)
    print(f"Saved: {png_path} ({os.path.getsize(png_path) / 1024:.1f} KB)")
    
    # Generate Seasonal & Decadal Anomaly Frames
    def sar_composite(vv, vh):
        r = np.clip((vv + 22.0) / 16.0, 0.0, 1.0)
        g = np.clip((vh + 28.0) / 16.0, 0.0, 1.0)
        ratio = vv - vh
        b = np.clip((ratio - 2.0) / 10.0, 0.0, 1.0)
        return (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)

    # 1. Spring Flooding Frame (DOY ~ 115, index 7)
    spring_rgb = sar_composite(copol_stack[7], crosspol_stack[7])
    save_png(spring_rgb, os.path.join(target_dir, "heartbeat_spring_flood.png"))
    
    # 2. Summer Peak Canopy Frame (DOY ~ 220, index 15)
    summer_rgb = sar_composite(copol_stack[15], crosspol_stack[15])
    save_png(summer_rgb, os.path.join(target_dir, "heartbeat_summer_peak.png"))
    
    # 3. Autumn Harvest Stubble Frame (DOY ~ 285, index 19)
    autumn_rgb = sar_composite(copol_stack[19], crosspol_stack[19])
    save_png(autumn_rgb, os.path.join(target_dir, "heartbeat_autumn_harvest.png"))
    
    # 4. 2021 Megadrought Anomaly Frame (unplanted fallow paddies)
    drought_copol = np.copy(copol_stack[15])
    drought_crosspol = np.copy(crosspol_stack[15])
    drought_mask = (parcel_id < 8) & (~river_mask)
    drought_copol[drought_mask] -= 6.5
    drought_crosspol[drought_mask] -= 8.0
    drought_rgb = sar_composite(drought_copol, drought_crosspol)
    save_png(drought_rgb, os.path.join(target_dir, "heartbeat_drought.png"))
    print("Saved seasonal & climate anomaly frames (Spring Flood, Summer Peak, Autumn Harvest, 2021 Drought).")
    
    # Save NPZ Stack
    npz_path = os.path.join(target_dir, "sar_stack.npz")
    np.savez_compressed(
        npz_path,
        dates=np.array(dates),
        doys=doys,
        lats=lats,
        lons=lons,
        copol_stack=copol_stack,
        crosspol_stack=crosspol_stack,
        a0=a0.astype(np.float32),
        amplitude=amplitude.astype(np.float32),
        phase_rad=phase_rad.astype(np.float32)
    )
    print(f"Saved: {npz_path} ({os.path.getsize(npz_path) / (1024*1024):.2f} MB)")
    print(f"Successfully generated {region_id} dataset!\n")

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dir = os.path.join(base_dir, "app", "data")
    
    generate_region_dataset("sacramento", width=500, height=500, num_dates=25, output_dir=out_dir)
    generate_region_dataset("punjab", width=500, height=500, num_dates=25, output_dir=out_dir)
