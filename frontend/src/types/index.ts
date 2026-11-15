export interface Region {
  id: string;
  name: string;
  country: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
  bounds: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  primary_crop: string;
  radar_bands: string[];
  description: string;
}

export interface NoteEvent {
  date: string;
  doy: number;
  frequency_hz: number;
  gain: number;
  filter_cutoff_hz: number;
  copol_db: number;
  crosspol_db: number;
  ratio_db: number;
}

export interface LandClassification {
  type: string;
  description: string;
  acoustic_archetype: string;
}

export interface HarmonicParams {
  a0: number;
  a1: number;
  b1: number;
  amplitude: number;
  phase_rad: number;
  phase_doy: number;
  r_squared: number;
}

export interface TimeSeriesEntry {
  date: string;
  doy: number;
  copol_dB: number;
  crosspol_dB: number;
  ratio_dB: number;
  fitted_dB: number;
}

export interface PointQueryResponse {
  region: string;
  coordinates: {
    lat: number;
    lon: number;
    queried_lat: number;
    queried_lon: number;
  };
  harmonic: HarmonicParams;
  classification: LandClassification;
  sonification: {
    base_frequency_hz: number;
    tempo_bpm: number;
    duration_seconds: number;
    note_events: NoteEvent[];
  };
  time_series: TimeSeriesEntry[];
  decadal_time_series?: TimeSeriesEntry[];
  decadal_sonification?: {
    site_name: string;
    total_epochs: number;
    tempo_bpm: number;
    duration_seconds: number;
    note_events: NoteEvent[];
  };
}
