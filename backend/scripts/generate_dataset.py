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
    
    # Spatial terrain synthesis
    # 1. River channel running through region
    river_x = 0.45 + 0.08 * np.sin(yy * 3.0 * np.pi) + 0.03 * np.cos(yy * 7.0 * np.pi)
    river_mask = np.abs(xx - river_x) < 0.025
    
    # 2. Field parcel grid simulation (checkerboard agricultural parcels)
    parcel_scale = 30.0
    parcel_id = (np.floor(xx * parcel_scale) * 17.0 + np.floor(yy * parcel_scale) * 31.0) % 7
    
    # 3. Time series synthesis based on region phenology
    copol_stack = np.zeros((num_dates, height, width), dtype=np.float32)
    crosspol_stack = np.zeros((num_dates, height, width), dtype=np.float32)
    
    rng = np.random.default_rng(42 if region_id == "sacramento" else 1337)
    
    for t_idx, doy in enumerate(doys):
        # Default grassland / pasture
        cp = -15.0 + 2.5 * np.sin(2.0 * np.pi * (doy - 120) / 365.0)
        xp = -23.0 + 2.0 * np.sin(2.0 * np.pi * (doy - 120) / 365.0)
        
        copol = np.full((height, width), cp, dtype=np.float32)
        crosspol = np.full((height, width), xp, dtype=np.float32)
        
        if region_id == "sacramento":
            # Type 0, 1, 2: Rice paddies (flooded in spring, peak canopy in Aug, harvest in Oct)
            rice_mask = (parcel_id < 3) & (~river_mask)
            
            if doy < 100:  # Winter bare/wet
                rice_cp = -16.0
                rice_xp = -24.0
            elif 100 <= doy < 140:  # Spring flooding (drop!)
                rice_cp = -22.5 + (doy - 100) * 0.05
                rice_xp = -28.0
            elif 140 <= doy < 240:  # Vegetative surge
                progress = (doy - 140) / 100.0
                rice_cp = -20.5 + progress * 12.0  # reaches -8.5 dB
                rice_xp = -26.0 + progress * 13.0  # reaches -13.0 dB
            elif 240 <= doy < 280:  # Maturation & pre-harvest
                rice_cp = -9.0 - (doy - 240) * 0.05
                rice_xp = -13.5 - (doy - 240) * 0.05
            else:  # Post-harvest stubble / winter flood
                rice_cp = -17.0
                rice_xp = -25.0
                
            copol[rice_mask] = rice_cp
            crosspol[rice_mask] = rice_xp
            
            # Type 3, 4: Permanent Walnut / Almond Orchards (consistent high volume scattering)
            orchard_mask = ((parcel_id == 3) | (parcel_id == 4)) & (~river_mask)
            copol[orchard_mask] = -10.5 + 1.2 * np.sin(2.0 * np.pi * (doy - 150) / 365.0)
            crosspol[orchard_mask] = -15.8 + 1.0 * np.sin(2.0 * np.pi * (doy - 150) / 365.0)
            
            # Type 5: Urban / Built-up (high backscatter, flat line)
            urban_mask = (parcel_id == 5) & (xx < 0.3) & (yy > 0.65) & (~river_mask)
            copol[urban_mask] = -6.5
            crosspol[urban_mask] = -13.0

        else: # Punjab (Dual Kharif Rice + Rabi Wheat rotation)
            agri_mask = (parcel_id < 5) & (~river_mask)
            # Peak 1: Rabi Wheat (peaks around DOY 70 in March)
            rabi_peak = 6.0 * np.exp(-((doy - 70) ** 2) / (2 * (30 ** 2)))
            # Peak 2: Kharif Rice (peaks around DOY 245 in September)
            kharif_peak = 7.5 * np.exp(-((doy - 245) ** 2) / (2 * (35 ** 2)))
            
            punjab_cp = -16.5 + rabi_peak + kharif_peak
            punjab_xp = -24.0 + (rabi_peak * 0.9) + (kharif_peak * 1.1)
            
            if 150 <= doy <= 175: # Kharif initial puddling/flooding
                punjab_cp -= 4.0
                punjab_xp -= 3.5
                
            copol[agri_mask] = punjab_cp
            crosspol[agri_mask] = punjab_xp
            
            # Urban center (e.g. Ludhiana cluster)
            urban_mask = (parcel_id == 5) & (xx > 0.6) & (yy > 0.5) & (~river_mask)
            copol[urban_mask] = -6.0
            crosspol[urban_mask] = -12.5

        # Open water body (River)
        copol[river_mask] = -23.5
        crosspol[river_mask] = -29.0
        
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
