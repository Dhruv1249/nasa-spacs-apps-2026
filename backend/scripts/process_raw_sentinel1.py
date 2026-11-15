#!/usr/bin/env python3
"""
Sentinel-1 GRD Raw Scene Processor
Directly extracts and calibrates the Sacramento / Punjab sub-window from a downloaded .zip file
without extracting the full 1GB+ TIFF to disk.
"""

import os
import sys
import zipfile
import struct
import xml.etree.ElementTree as ET
import numpy as np

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.services.image_utils import save_png

def process_sentinel1_zip(zip_path: str, output_dir: str = None):
    if output_dir is None:
        base = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        output_dir = os.path.join(base, "app", "data", "sacramento")
    print(f"\n🛰️  Processing Sentinel-1 Scene: {os.path.basename(zip_path)}")
    print("=" * 80)
    
    with zipfile.ZipFile(zip_path, 'r') as z:
        names = z.namelist()
        
        # Locate measurement TIFFs and annotation XMLs
        vv_tiff = [n for n in names if 'measurement' in n and 'vv' in n and n.endswith('.tiff')][0]
        vh_tiff = [n for n in names if 'measurement' in n and 'vh' in n and n.endswith('.tiff')][0]
        vv_ann = [n for n in names if 'annotation/s1' in n and 'vv' in n and n.endswith('.xml')][0]
        vv_cal = [n for n in names if 'calibration/calibration' in n and 'vv' in n and n.endswith('.xml')][0]
        
        # Parse XML Annotation for dimensions and geolocation
        root = ET.fromstring(z.read(vv_ann))
        num_samples = int(root.find('.//imageAnnotation/imageInformation/numberOfSamples').text)
        num_lines = int(root.find('.//imageAnnotation/imageInformation/numberOfLines').text)
        acq_time = root.find('.//imageAnnotation/imageInformation/productFirstLineUtcTime').text
        pass_dir = root.find('.//generalAnnotation/productInformation/pass').text
        
        print(f"Acquisition Time: {acq_time}")
        print(f"Flight Direction: {pass_dir}")
        print(f"Full Swath Size:  {num_samples:,} cols x {num_lines:,} rows (~{num_samples*num_lines/1e6:.1f} Megapixels)")
        
        # Geolocation grid points
        grid_pts = root.findall('.//geolocationGridPoint')
        lines = [int(p.find('line').text) for p in grid_pts]
        pixels = [int(p.find('pixel').text) for p in grid_pts]
        lats = [float(p.find('latitude').text) for p in grid_pts]
        lons = [float(p.find('longitude').text) for p in grid_pts]
        
        # Target: Sacramento Valley (lat 38.68 to 38.98, lon -121.90 to -121.55)
        # Find closest grid points to calculate bounding box lines and pixels
        sac_pts = [(l, px, lat, lon) for l, px, lat, lon in zip(lines, pixels, lats, lons) 
                   if 38.65 <= lat <= 39.00 and -121.95 <= lon <= -121.50]
        
        if not sac_pts:
            print("Notice: No exact Sacramento Valley overlap found, using central sub-window.")
            min_line, max_line = num_lines // 2 - 1000, num_lines // 2 + 1000
            min_pixel, max_pixel = num_samples // 2 - 1000, num_samples // 2 + 1000
        else:
            min_line = max(0, min(p[0] for p in sac_pts) - 100)
            max_line = min(num_lines, max(p[0] for p in sac_pts) + 100)
            min_pixel = max(0, min(p[1] for p in sac_pts) - 100)
            max_pixel = min(num_samples, max(p[1] for p in sac_pts) + 100)
            
        crop_h = max_line - min_line
        crop_w = max_pixel - min_pixel
        print(f"\nCropping Study Sub-window:")
        print(f"Lines:  {min_line} to {max_line} (height: {crop_h} px)")
        print(f"Pixels: {min_pixel} to {max_pixel} (width:  {crop_w} px)")
        
        # Read calibration factor
        cal_root = ET.fromstring(z.read(vv_cal))
        first_cal_vec = cal_root.find('.//calibrationVector')
        cal_factors = [float(x) for x in first_cal_vec.find('sigmaNought').text.split()]
        mean_cal = np.mean(cal_factors)
        print(f"Mean Calibration Factor A_sigma: {mean_cal:.2f}")
        
        # Function to read cropped raster directly from uncompressed zip stream
        def read_crop(tiff_member_name: str, step: int = 4) -> np.ndarray:
            print(f"Reading scanlines from {os.path.basename(tiff_member_name)} (downsampling {step}x)...")
            line_stride = num_samples * 2  # 2 bytes per uint16 sample
            out_rows = []
            
            with z.open(tiff_member_name) as f:
                # Dynamically retrieve base strip offset from Tag 273
                try:
                    f.seek(848115972)
                    base_offset = struct.unpack('<I', f.read(4))[0]
                except Exception:
                    base_offset = 133987
                    
                for line_idx in range(min_line, max_line, step):
                    # Seek to start of this line's crop window
                    offset = base_offset + (line_idx * line_stride) + (min_pixel * 2)
                    f.seek(offset)
                    raw_bytes = f.read(crop_w * 2)
                    # Unpack little-endian uint16
                    row = np.frombuffer(raw_bytes, dtype='<u2')[::step]
                    out_rows.append(row)
                    
            return np.array(out_rows, dtype=np.float32)

        # Extract VV and VH crops (downsampled 4x for speed and fast display ~1000x1000)
        vv_raw = read_crop(vv_tiff, step=4)
        vh_raw = read_crop(vh_tiff, step=4)
        
        # Calibrate DN to Sigma Nought (dB)
        # Sigma0 = (DN^2) / (A_sigma^2)
        print("\nCalibrating Digital Numbers to Radar Backscatter Sigma Nought (dB)...")
        vv_sigma0 = (vv_raw ** 2) / (mean_cal ** 2)
        vh_sigma0 = (vh_raw ** 2) / (mean_cal ** 2)
        
        vv_db = 10.0 * np.log10(np.maximum(vv_sigma0, 1e-5))
        vh_db = 10.0 * np.log10(np.maximum(vh_sigma0, 1e-5))
        ratio_db = vv_db - vh_db
        
        print(f"VV Backscatter Range:   {np.percentile(vv_db, 2):.1f} dB to {np.percentile(vv_db, 98):.1f} dB")
        print(f"VH Backscatter Range:   {np.percentile(vh_db, 2):.1f} dB to {np.percentile(vh_db, 98):.1f} dB")
        print(f"Dual-Pol Ratio Range:   {np.percentile(ratio_db, 2):.1f} dB to {np.percentile(ratio_db, 98):.1f} dB")
        
        # Create Dual-Pol False Color RGB Composite:
        # Red = VV (normalized -25 to -5 dB)
        # Green = VH (normalized -30 to -10 dB)
        # Blue = Ratio VV/VH (normalized 2 to 12 dB)
        r = np.clip((vv_db + 25.0) / 20.0, 0.0, 1.0)
        g = np.clip((vh_db + 30.0) / 20.0, 0.0, 1.0)
        b = np.clip((ratio_db - 2.0) / 10.0, 0.0, 1.0)
        
        rgb = (np.stack([r, g, b], axis=-1) * 255.0).astype(np.uint8)
        
        os.makedirs(output_dir, exist_ok=True)
        out_png = os.path.join(output_dir, "real_radar_crop.png")
        save_png(rgb, out_png)
        print(f"\n✅ Saved Dual-Pol SAR Composite: {out_png} ({os.path.getsize(out_png) / 1024:.1f} KB)")
        
        # Save compact numpy array
        out_npz = os.path.join(output_dir, "real_radar_crop.npz")
        np.savez_compressed(out_npz, vv_db=vv_db, vh_db=vh_db, ratio_db=ratio_db, date=acq_time[:10])
        print(f"✅ Saved Calibrated Arrays:    {out_npz} ({os.path.getsize(out_npz) / (1024*1024):.2f} MB)")
        print("\nProcessing complete! Real satellite backscatter is now ready for sonification.")

if __name__ == "__main__":
    zip_file = "/home/dhruv/nasa/S1D_IW_GRDH_1SDV_20261112T015903_20261112T015928_005428_00A5BC_3170.zip"
    if len(sys.argv) > 1:
        zip_file = sys.argv[1]
        
    if not os.path.exists(zip_file):
        print(f"Error: {zip_file} not found.")
        sys.exit(1)
        
    process_sentinel1_zip(zip_file)
