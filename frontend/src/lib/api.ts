import { Region, PointQueryResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const FALLBACK_REGIONS: Region[] = [
  {
    id: "sacramento",
    name: "Sacramento Valley, California",
    country: "USA",
    center: [-121.72, 38.83],
    zoom: 11,
    bounds: [-121.90, 38.68, -121.55, 38.98],
    primary_crop: "Single-Cycle Flooded Rice & Walnut Orchards",
    radar_bands: ["L-band (NISAR/UAVSAR)", "C-band (Sentinel-1)"],
    description: "Features spring field flooding (radar specular drop), explosive summer greening, and autumn harvest."
  },
  {
    id: "punjab",
    name: "Indo-Gangetic Plain, Punjab",
    country: "India",
    center: [75.85, 30.90],
    zoom: 11,
    bounds: [75.70, 30.75, 76.05, 31.05],
    primary_crop: "Kharif (Rice) - Rabi (Wheat) Dual Rotation",
    radar_bands: ["L-band (NISAR)", "C-band (Sentinel-1)"],
    description: "Core NASA-ISRO Cal/Val agricultural belt with two distinct seasonal heartbeats per year."
  }
];

export async function fetchRegions(): Promise<Region[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/regions`);
    if (!res.ok) throw new Error("Failed to fetch regions");
    const data = await res.json();
    return data.regions;
  } catch (err) {
    console.warn("Backend API unavailable, using local region definitions.", err);
    return FALLBACK_REGIONS;
  }
}

export function getHeartbeatImageUrl(regionId: string, frame?: string): string {
  const query = frame ? `?frame=${frame}&v=3` : `?v=3`;
  return `${API_BASE_URL}/api/heartbeat/${regionId}/image.png${query}`;
}

export async function queryPoint(regionId: string, lat: number, lon: number): Promise<PointQueryResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/point?region=${regionId}&lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error("Failed to query point");
    return await res.json();
  } catch (err) {
    console.warn("Backend API query failed, generating client-side fallback data.", err);
    return generateClientFallbackPoint(regionId, lat, lon);
  }
}

function generateClientFallbackPoint(regionId: string, lat: number, lon: number): PointQueryResponse {
  const doys = Array.from({ length: 25 }, (_, i) => Math.round(15 + i * 14.1));
  const dates = doys.map(doy => `2025-${String(Math.floor(doy / 30) + 1).padStart(2, "0")}-${String((doy % 28) + 1).padStart(2, "0")}`);
  
  const isSacramento = regionId === "sacramento";
  const timeSeries = doys.map(doy => {
    let cp = -15.0;
    let xp = -23.0;
    if (isSacramento) {
      if (doy < 100) { cp = -16.0; xp = -24.0; }
      else if (doy < 140) { cp = -22.5; xp = -28.0; }
      else if (doy < 240) {
        const prog = (doy - 140) / 100;
        cp = -20.5 + prog * 12.0;
        xp = -26.0 + prog * 13.0;
      } else if (doy < 280) { cp = -10.0; xp = -14.5; }
      else { cp = -17.0; xp = -25.0; }
    } else {
      const rabi = 6.0 * Math.exp(-Math.pow(doy - 70, 2) / 1800);
      const kharif = 7.5 * Math.exp(-Math.pow(doy - 245, 2) / 2450);
      cp = -16.5 + rabi + kharif;
      xp = -24.0 + rabi * 0.9 + kharif * 1.1;
    }
    const noise = (Math.sin(doy * 13.7) * 0.4);
    return {
      date: dates[doys.indexOf(doy)],
      doy,
      copol_dB: +(cp + noise).toFixed(2),
      crosspol_dB: +(xp + noise).toFixed(2),
      ratio_dB: +(cp - xp).toFixed(2),
      fitted_dB: +(cp).toFixed(2)
    };
  });

  const noteEvents = timeSeries.map(ts => {
    const normBiomass = Math.max(0, Math.min(1, (ts.crosspol_dB + 28) / 18));
    return {
      date: ts.date,
      doy: ts.doy,
      frequency_hz: Math.round(140 + Math.pow(normBiomass, 1.5) * 520),
      gain: Math.max(0.1, Math.min(0.9, (ts.copol_dB + 26) / 22)),
      filter_cutoff_hz: Math.round(250 + Math.pow(normBiomass, 1.2) * 2950),
      copol_db: ts.copol_dB,
      crosspol_db: ts.crosspol_dB,
      ratio_db: ts.ratio_dB
    };
  });

  return {
    region: regionId,
    coordinates: { lat, lon, queried_lat: lat, queried_lon: lon },
    harmonic: {
      a0: isSacramento ? -14.2 : -15.1,
      a1: 4.2,
      b1: -3.1,
      amplitude: 5.2,
      phase_rad: 5.65,
      phase_doy: isSacramento ? 220 : 75,
      r_squared: 0.88
    },
    classification: {
      type: isSacramento ? "Single-Cycle Flooded Rice" : "Intensive Rotational Farmland (Wheat-Rice)",
      description: isSacramento
        ? "Spring inundation causes a sharp drop, followed by explosive summer canopy volume growth and autumn harvest crescendo."
        : "Dramatic cyclical shifts in vegetation canopy roughness produce a pulsating, rhythmic harmonic melody.",
      acoustic_archetype: isSacramento ? "paddy_crescendo" : "rotational_arpeggio"
    },
    sonification: {
      base_frequency_hz: 310,
      tempo_bpm: 120,
      duration_seconds: 3.8,
      note_events: noteEvents
    },
    time_series: timeSeries
  };
}
