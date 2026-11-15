import numpy as np
from typing import Dict, Any, List

def classify_land_cover(mean_db: float, amplitude_db: float, phase_doy: float, ratio_mean_db: float) -> Dict[str, str]:
    """
    Classifies the land surface into an acoustic archetype based on SAR physical scattering.
    """
    if mean_db < -20.0 and amplitude_db < 2.5:
        return {
            "type": "Open Water / River",
            "description": "Specular microwave scattering reflects pulses away. Quiet, deep resonant bass hum.",
            "acoustic_archetype": "sub_bass_drone"
        }
    elif mean_db > -9.0 and amplitude_db < 2.5:
        return {
            "type": "Urban / Built-up Infrastructure",
            "description": "Corner reflection off concrete and metal creates high backscatter. Steady, metallic harmonic tone.",
            "acoustic_archetype": "metallic_resonance"
        }
    elif mean_db > -12.0 and amplitude_db < 3.0:
        return {
            "type": "Perennial Orchard / Dense Forest",
            "description": "Continuous multi-path volume scattering within tree branches. Sustained, warm harmonic hum.",
            "acoustic_archetype": "warm_canopy_pad"
        }
    elif amplitude_db >= 4.0 and (180 <= phase_doy <= 260):
        return {
            "type": "Single-Cycle Flooded Rice",
            "description": "Spring inundation causes a sharp drop, followed by explosive summer canopy volume growth and autumn harvest crescendo.",
            "acoustic_archetype": "paddy_crescendo"
        }
    elif amplitude_db >= 3.5:
        return {
            "type": "Intensive Rotational Farmland (e.g. Wheat-Rice)",
            "description": "Dramatic cyclical shifts in vegetation canopy roughness produce a pulsating, rhythmic harmonic melody.",
            "acoustic_archetype": "rotational_arpeggio"
        }
    else:
        return {
            "type": "Pasture / Seasonal Grassland",
            "description": "Moderate surface and volume scattering with mild seasonal greening.",
            "acoustic_archetype": "pastoral_melody"
        }

def calculate_sonification_profile(
    dates: List[str],
    doys: List[int],
    copol_db: List[float],
    crosspol_db: List[float],
    harmonic: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes real-time Web Audio API parameters for frontend synthesis.
    """
    mean_db = harmonic.get("a0", -14.0)
    amplitude_db = harmonic.get("amplitude", 4.0)
    phase_doy = harmonic.get("phase_doy", 200.0)
    
    ratios = [c - x for c, x in zip(copol_db, crosspol_db)]
    mean_ratio = float(np.mean(ratios)) if ratios else 6.0
    
    classification = classify_land_cover(mean_db, amplitude_db, phase_doy, mean_ratio)
    
    # Calculate note events for each revisit date
    note_events = []
    for d, doy, cp, xp, rat in zip(dates, doys, copol_db, crosspol_db, ratios):
        # Pitch: mapped between 130 Hz (C3) and 660 Hz (E5) based on cross-polarization biomass
        # Cross-pol typically ranges from -28 dB (bare/water) to -12 dB (dense crop)
        norm_biomass = float(np.clip((xp + 28.0) / 18.0, 0.0, 1.0))
        freq_hz = float(140.0 + (norm_biomass ** 1.5) * 520.0)
        
        # Gain: overall power from -26 dB to -6 dB
        norm_gain = float(np.clip((cp + 26.0) / 22.0, 0.05, 0.95))
        
        # Filter cutoff: lowpass filter opens from 250 Hz (flooded/bare) to 3200 Hz (canopy)
        filter_cutoff_hz = float(250.0 + (norm_biomass ** 1.2) * 2950.0)
        
        note_events.append({
            "date": d,
            "doy": doy,
            "frequency_hz": round(freq_hz, 1),
            "gain": round(norm_gain, 3),
            "filter_cutoff_hz": round(filter_cutoff_hz, 1),
            "copol_db": round(cp, 2),
            "crosspol_db": round(xp, 2),
            "ratio_db": round(rat, 2)
        })
        
    return {
        "classification": classification,
        "base_frequency_hz": round(float(180.0 + (amplitude_db * 25.0)), 1),
        "tempo_bpm": 120,
        "duration_seconds": 3.8,
        "note_events": note_events
    }
