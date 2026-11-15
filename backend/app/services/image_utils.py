import zlib
import struct
import numpy as np

def array_to_png_bytes(rgb_array: np.ndarray) -> bytes:
    """
    Converts a uint8 RGB numpy array (H, W, 3) or RGBA (H, W, 4) into PNG bytes
    without external dependencies (pure Python zlib + struct).
    """
    if rgb_array.dtype != np.uint8:
        rgb_array = np.clip(rgb_array, 0, 255).astype(np.uint8)
        
    H, W = rgb_array.shape[:2]
    channels = rgb_array.shape[2] if rgb_array.ndim == 3 else 1
    
    # Color types: 0 (Grayscale), 2 (RGB), 6 (RGBA)
    if channels == 3:
        color_type = 2
    elif channels == 4:
        color_type = 6
    elif channels == 1:
        color_type = 0
    else:
        raise ValueError(f"Unsupported channel count: {channels}")
        
    # Raw scanlines with filter byte 0 (None) at the start of each row
    raw_scanlines = b''.join(b'\x00' + rgb_array[y].tobytes() for y in range(H))
    compressed_idat = zlib.compress(raw_scanlines, level=6)
    
    def make_chunk(chunk_type: bytes, data: bytes) -> bytes:
        length = struct.pack('>I', len(data))
        crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return length + chunk_type + data + crc

    ihdr_data = struct.pack('>IIBBBBB', W, H, 8, color_type, 0, 0, 0)
    
    return (
        b'\x89PNG\r\n\x1a\n' +
        make_chunk(b'IHDR', ihdr_data) +
        make_chunk(b'IDAT', compressed_idat) +
        make_chunk(b'IEND', b'')
    )

def save_png(rgb_array: np.ndarray, file_path: str):
    """Saves uint8 RGB array to a PNG file."""
    data = array_to_png_bytes(rgb_array)
    with open(file_path, 'wb') as f:
        f.write(data)
