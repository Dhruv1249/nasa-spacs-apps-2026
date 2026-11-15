import numpy as np
from typing import Tuple, Dict, Any
import colorsys

def linear_to_db(linear_val: np.ndarray, epsilon: float = 1e-6) -> np.ndarray:
    """Convert linear radar power to decibels (dB)."""
    return 10.0 * np.log10(np.maximum(linear_val, epsilon))

def db_to_linear(db_val: np.ndarray) -> np.ndarray:
    """Convert decibels (dB) back to linear radar power."""
    return 10.0 ** (db_val / 10.0)

def fit_first_order_harmonic(doy_array: np.ndarray, values_db: np.ndarray) -> Dict[str, float]:
    """
    Fits y(t) = a0 + a1*cos(w*t) + b1*sin(w*t) where w = 2*pi/365.
    Returns: a0, a1, b1, amplitude, phase_rad, phase_doy, r_squared.
    """
    omega = 2.0 * np.pi / 365.0
    cos_term = np.cos(omega * doy_array)
    sin_term = np.sin(omega * doy_array)
    
    # Design matrix: [1, cos, sin]
    X = np.column_stack([np.ones_like(doy_array), cos_term, sin_term])
    
    # Solve least squares: beta = (X^T X)^(-1) X^T y
    try:
        beta, residuals, rank, s = np.linalg.lstsq(X, values_db, rcond=None)
        a0, a1, b1 = float(beta[0]), float(beta[1]), float(beta[2])
    except Exception:
        a0, a1, b1 = float(np.mean(values_db)), 0.0, 0.0
    
    amplitude = float(np.sqrt(a1**2 + b1**2))
    phase_rad = float(np.arctan2(b1, a1) % (2.0 * np.pi))
    phase_doy = float((phase_rad / (2.0 * np.pi)) * 365.0)
    
    fitted_values = a0 + a1 * cos_term + b1 * sin_term
    ss_tot = np.sum((values_db - np.mean(values_db))**2)
    ss_res = np.sum((values_db - fitted_values)**2)
    r_squared = float(1.0 - (ss_res / ss_tot)) if ss_tot > 1e-6 else 0.0
    r_squared = max(0.0, min(1.0, r_squared))
    
    return {
        "a0": a0,
        "a1": a1,
        "b1": b1,
        "amplitude": amplitude,
        "phase_rad": phase_rad,
        "phase_doy": phase_doy,
        "r_squared": r_squared
    }

def fit_second_order_harmonic(doy_array: np.ndarray, values_db: np.ndarray) -> Dict[str, float]:
    """
    Fits y(t) = a0 + a1*cos(w*t) + b1*sin(w*t) + a2*cos(2w*t) + b2*sin(2w*t).
    Essential for dual-cropping rotations (e.g. Punjab rice-wheat).
    """
    omega = 2.0 * np.pi / 365.0
    c1 = np.cos(omega * doy_array)
    s1 = np.sin(omega * doy_array)
    c2 = np.cos(2.0 * omega * doy_array)
    s2 = np.sin(2.0 * omega * doy_array)
    
    X = np.column_stack([np.ones_like(doy_array), c1, s1, c2, s2])
    
    try:
        beta, _, _, _ = np.linalg.lstsq(X, values_db, rcond=None)
        a0, a1, b1, a2, b2 = [float(x) for x in beta]
    except Exception:
        a0 = float(np.mean(values_db))
        a1, b1, a2, b2 = 0.0, 0.0, 0.0, 0.0

    amp1 = float(np.sqrt(a1**2 + b1**2))
    amp2 = float(np.sqrt(a2**2 + b2**2))
    phase1_doy = float((np.arctan2(b1, a1) % (2.0 * np.pi)) / (2.0 * np.pi) * 365.0)
    phase2_doy = float((np.arctan2(b2, a2) % (2.0 * np.pi)) / (4.0 * np.pi) * 365.0)

    fitted = a0 + a1 * c1 + b1 * s1 + a2 * c2 + b2 * s2
    ss_tot = np.sum((values_db - np.mean(values_db))**2)
    ss_res = np.sum((values_db - fitted)**2)
    r_squared = float(1.0 - (ss_res / ss_tot)) if ss_tot > 1e-6 else 0.0

    return {
        "a0": a0,
        "amp1": amp1,
        "phase1_doy": phase1_doy,
        "amp2": amp2,
        "phase2_doy": phase2_doy,
        "r_squared": max(0.0, min(1.0, r_squared))
    }

def harmonic_to_rgb(phase_rad: np.ndarray, amplitude: np.ndarray, mean_db: np.ndarray) -> np.ndarray:
    """
    Converts 2D arrays of phase, amplitude, and mean backscatter to uint8 RGB (H, W, 3).
    Hue = Phase (0 to 2pi -> 0 to 1)
    Saturation = Normalized Amplitude (0 dB to 8 dB -> 0 to 1)
    Value = Normalized Mean Backscatter (-25 dB to -5 dB -> 0 to 1)
    """
    H = (phase_rad / (2.0 * np.pi)) % 1.0
    S = np.clip(amplitude / 7.0, 0.15, 1.0)
    V = np.clip((mean_db + 25.0) / 20.0, 0.2, 1.0)
    
    # Vectorized HSV to RGB conversion
    i = np.floor(H * 6.0).astype(int)
    f = (H * 6.0) - i
    p = V * (1.0 - S)
    q = V * (1.0 - f * S)
    t = V * (1.0 - (1.0 - f) * S)
    
    r = np.zeros_like(H)
    g = np.zeros_like(H)
    b = np.zeros_like(H)
    
    idx = i % 6
    r[idx == 0] = V[idx == 0]; g[idx == 0] = t[idx == 0]; b[idx == 0] = p[idx == 0]
    r[idx == 1] = q[idx == 1]; g[idx == 1] = V[idx == 1]; b[idx == 1] = p[idx == 1]
    r[idx == 2] = p[idx == 2]; g[idx == 2] = V[idx == 2]; b[idx == 2] = t[idx == 2]
    r[idx == 3] = p[idx == 3]; g[idx == 3] = q[idx == 3]; b[idx == 3] = V[idx == 3]
    r[idx == 4] = t[idx == 4]; g[idx == 4] = p[idx == 4]; b[idx == 4] = V[idx == 4]
    r[idx == 5] = V[idx == 5]; g[idx == 5] = p[idx == 5]; b[idx == 5] = q[idx == 5]
    
    rgb = np.stack([r, g, b], axis=-1)
    return (rgb * 255.0).astype(np.uint8)
