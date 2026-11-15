# Land Heartbeat and The Sound of the Land

> **NASA Space Apps Challenge 2026**
> *Translating Satellite Synthetic Aperture Radar Polarimetry and Decadal Phenological Dynamics into Multi-Sensory Visualizations and Acoustic Sonification*

[![Backend - FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Frontend - Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![Data Source - Copernicus Sentinel-1](https://img.shields.io/badge/SAR-Sentinel--1%20C--Band-blue.svg)](https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-1)
[![Validation - NASA ISRO NISAR](https://img.shields.io/badge/Mission-NISAR%20L--Band-orange.svg)](https://nisar.jpl.nasa.gov/)
[![Deploy - Cloud Run](https://img.shields.io/badge/Deploy-GCP%20Cloud%20Run-4285F4.svg)](https://cloud.google.com/run)
[![License - MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Executive Summary

Earth undergoes continuous, cyclical transformations driven by seasons, hydrology, and human agriculture. Optical satellites frequently struggle to capture these processes due to persistent cloud cover, monsoon rain, smoke, and nighttime limitations. Synthetic Aperture Radar (SAR) bypasses these barriers by transmitting active microwave pulses that penetrate atmospheric interference to measure physical surface geometry, roughness, moisture, and dielectric properties.

Land Heartbeat and The Sound of the Land is an end-to-end scientific and sensory platform that translates 10 years of multi-temporal satellite radar backscatter into:
1. **Land Heartbeat**: A spatial-harmonic decomposition that encodes seasonal crop cycles, peak biomass dates, and phenological amplitude into false-color radar composites and 244 decadal satellite timelapse frames spanning 2016 through 2026.
2. **The Sound of the Land**: A real-time acoustic sonification engine powered by the native Web Audio API that transforms microwave scattering physics (co-polarization, cross-polarization, and depolarization ratio) into soundscapes, allowing users to listen to the growth, flooding, and harvest of landscapes.

The system focuses on two globally critical agricultural basins with contrasting environmental regimes: the Sacramento Valley in California, USA (single-season flooded rice and orchards) and the Indo-Gangetic Plain in Punjab, India (intensive dual-crop wheat and rice rotation).

---

## 2. What the System Does

### 2.1 Multi-Temporal SAR Remote Sensing
The platform visualizes and queries calibrated backscatter data collected by the European Space Agency (ESA) Copernicus Sentinel-1 satellite constellation and calibrated against NASA UAVSAR and NISAR science parameters. Backscatter coefficients are processed in decibels (dB) across dual polarizations:
* **VV (Vertical-transmit, Vertical-receive)**: Sensitive to surface roughness, soil moisture, and direct structural reflections.
* **VH (Vertical-transmit, Horizontal-receive)**: Sensitive to volumetric scattering within complex multi-layered vegetation canopies.

### 2.2 Land Heartbeat: Seasonal Phenology Fingerprinting
Agricultural parcels oscillate between bare dry ground, standing irrigation water, dense vegetative canopy, and bare stubble after harvest. By fitting multi-order Fourier harmonics to the time series of every geographic pixel over 365 days, the platform generates a phenological fingerprint:
* **Phase (Peak Timing) to Hue**: Identifies the exact calendar period when crop canopy reaches maximum density. Spring greening appears in greens; summer rice peaks appear in magenta and rose; winter wheat peaks appear in blue and violet.
* **Amplitude to Saturation**: Measures the dynamic range between harvest and peak canopy. Highly active rotational cropland appears deeply saturated; paved urban infrastructure and bare desert remain desaturated gray.
* **Mean Backscatter Power to Brightness (Value)**: Measures average radar reflection. Smooth water bodies appear dark; forests and dense settlements appear bright.

### 2.3 Decadal Radar Timelapse (2016 to 2026)
The platform features an automated 10-year decadal playback engine with 244 multi-temporal radar frames:
* Uniform 15-day satellite revisit intervals spanning 2016-11-15 to 2026-11-15.
* Real-time playhead telemetry showing the exact calendar year, month, and day for both study regions.
* Speed stepper controls allowing playback rate adjustment in increments of 0.25x (ranging from 0.25x to 4.00x), with a deliberate 0.50x default for observational analysis.
* 60fps GPU-accelerated morph transition engine utilizing hardware matrix scaling, contrast/saturation boost, and sub-pixel contraction to simulate fluid radar transitions.

### 2.4 The Sound of the Land: Interactive Sonification
Users can click any geographic coordinate on the interactive map to query its radar history and generate an immediate musical sonification:
* **Pitch (Oscillator Frequency)**: Mapped to cross-polarization (VH) and depolarization ratio (VH/VV). As crops develop leaf volume and stem density, the pitch climbs upward from low bass (130 Hz) to clear treble (520 Hz).
* **Timbre (Biquad Filter Cutoff)**: A dynamic low-pass resonance filter opens as vegetation roughness increases. Inundated water fields sound muffled and subterranean; mature crops sound open and resonant.
* **Volume (Envelope Gain)**: Proportional to total backscatter intensity in dB, reflecting the total microwave energy returned to the satellite sensor.
* **Dual Harmonic Mode**: Automatically switches between annual single-harmonic playback and 10-year decadal multi-year playback.

### 2.5 Climate Extreme Telemetry
The platform provides direct visual and acoustic comparisons for historic weather anomalies:
* **Sacramento 2017 Atmospheric River Floods**: Extreme inundation characterized by widespread specular dropouts.
* **Sacramento 2021 Severe Drought**: Suppressed vegetative amplitude and lower seasonal biomass peaks due to fallowed acreage.
* **Sacramento 2023 Sierra Nevada Snowpack Inflow**: Unprecedented runoff leading to full reservoir storage and late-season irrigation surges.

---

## 3. How It Works: Technical Methodology

### 3.1 Data Sourcing and Calibration Pipeline
1. **Satellite Ingestion**: Calibrated Ground Range Detected (GRD) scenes are retrieved from Google Earth Engine (`COPERNICUS/S1_GRD`) and the Alaska Satellite Facility (ASF).
2. **Thermal Noise Removal and Terrain Correction**: Raw digital numbers (DN) are converted into gamma-nought and sigma-nought ($\sigma^0$) backscatter coefficients using Range Doppler terrain correction with the SRTM 30m digital elevation model.
3. **Logarithmic Scaling**: Linear power values are converted into decibels:
   $$\sigma^0_{\text{dB}} = 10 \cdot \log_{10}(\sigma^0_{\text{linear}})$$
4. **False-Color Composite Formulation**: 
   * Red Channel: VV backscatter normalized between $-22\text{ dB}$ and $-2\text{ dB}$.
   * Green Channel: VH backscatter normalized between $-28\text{ dB}$ and $-8\text{ dB}$.
   * Blue Channel: Cross-polarization difference ratio $|\text{VV} - \text{VH}|$ highlighting vegetation depolarization.

### 3.2 Harmonic Phenology Decomposition

#### Single-Harvest Harmonic Model (Sacramento Valley)
For regions with a single dominant annual crop cycle (such as flooded rice planted in May and harvested in September), backscatter is modeled using a first-order Fourier series:
$$y(t) = a_0 + a_1 \cos(\omega t) + b_1 \sin(\omega t)$$
where $\omega = \frac{2\pi}{365.25}$ radians per day.
* Amplitude: $A_1 = \sqrt{a_1^2 + b_1^2}$
* Phase: $\phi_1 = \text{atan2}(b_1, a_1)$

#### Dual-Harvest Second-Order Harmonic Model (Punjab Plain)
In the Indo-Gangetic Plain, farmers execute an intensive double-cropping schedule: Kharif rice (summer monsoon: June to October) followed by Rabi wheat (winter: November to April). A standard 365-day first-order harmonic cancels itself out through destructive interference, yielding an artificially flat line.

To solve this, the platform computes a second-order dual-frequency harmonic regression:
$$y(t) = a_0 + a_1 \cos(\omega t) + b_1 \sin(\omega t) + a_2 \cos(2\omega t) + b_2 \sin(2\omega t)$$
where the second harmonic ($2\omega$, period $T = 182.6\text{ days}$) isolates the semi-annual rotation, elevating curve fitting performance from an invalid $4\%$ $R^2$ to over $88\%$ $R^2$ on agricultural pixels.

### 3.3 Color Space Encoding (HSV to RGB)
The harmonic parameters map directly into the standard Hue-Saturation-Value (HSV) color cylinder:
* $\text{Hue} = \frac{\phi \pmod{2\pi}}{2\pi} \in [0.0, 1.0]$
* $\text{Saturation} = \min\left(1.0, \frac{A_1}{\tau_A}\right)$ where $\tau_A \approx 6.0\text{ dB}$ represents maximum seasonal swing.
* $\text{Value} = \text{clip}\left(\frac{a_0 - \mu_{\min}}{\mu_{\max} - \mu_{\min}}, 0.1, 1.0\right)$

The resulting HSV representation is converted to 32-bit RGBA imagery for zero-latency browser rendering via Leaflet and MapLibre canvas overlays.

### 3.4 Web Audio Synthesis Architecture
When a coordinate is clicked, the client transmits an asynchronous request to the backend spatial index. Upon receiving the time series:
1. An `AudioContext` instance initializes custom oscillator chains.
2. A polyphonic synthesizer triggers a primary sine oscillator and harmonic overtone triangle oscillator.
3. Frequency is computed using an exponential scaling transfer function:
   $$f(t) = f_{\min} \cdot \left(\frac{f_{\max}}{f_{\min}}\right)^{\text{norm}(\text{VH}(t))}$$
   with $f_{\min} = 130.81\text{ Hz}$ (C3) and $f_{\max} = 523.25\text{ Hz}$ (C5).
4. A dynamic second-order Biquad Low-Pass Filter receives continuous parameter updates:
   $$\text{cutoff}(t) = 350 + 2800 \cdot \text{norm}(\text{VH}(t))$$
   with resonance quality factor $Q = 3.5$.
5. An exponential gain stage applies attack, decay, sustain, and release (ADSR) envelopes per temporal step to eliminate speaker clipping and click transients.

---

## 4. Dual Study Regions and Scattering Physics

| Metric | Sacramento Valley, California, USA | Indo-Gangetic Plain, Punjab, India |
| :--- | :--- | :--- |
| **Geographic Bounds** | $[-121.90, 38.68, -121.55, 38.98]$ | $[75.70, 30.75, 76.05, 31.05]$ |
| **Dominant Cropping** | Flooded Calrose rice, almond and walnut orchards | Kharif rice alternating with Rabi winter wheat |
| **Hydrological Signature** | Spring field flooding (specular reflection minimum) | Dual irrigation surges (monsoon canal and tube-well) |
| **Harmonic Structure** | Single-cycle annual peak (August - September) | Semi-annual dual peaks (March/April and September/October) |
| **Acoustic Character** | Deep low-frequency sonar dip followed by high-treble summer swell | Rapid rhythmic arpeggio oscillating twice per calendar year |
| **Satellite Significance** | NASA UAVSAR airborne L-band cal/val site | Core validation epicenter for the NASA-ISRO NISAR mission |

### Microwave Scattering Mechanisms

| Physical Surface | SAR Scattering Regime | Backscatter Range | Visual Signature | Acoustic Property |
| :--- | :--- | :--- | :--- | :--- |
| **Calm Open Water / Flooded Fields** | Specular Reflection (microwave energy reflects away from satellite) | $-26\text{ dB}$ to $-20\text{ dB}$ (VV/VH very low) | Dark blue / black pixels | Sub-bass drone or near silence ($< 140\text{ Hz}$), muffled filter cutoff |
| **Bare Tilled Soil** | Surface Roughness Scattering | $-16\text{ dB}$ to $-12\text{ dB}$ (VV moderate, VH low) | Red / orange hue | Mid-range fundamental tone ($180 - 240\text{ Hz}$) |
| **Dense Crop Canopy (Mature Rice/Wheat)** | Volume Scattering (multiple reflections within leaves and stalks) | $-12\text{ dB}$ to $-7\text{ dB}$ (VH rises sharply) | Bright green / yellow hue | Treble pitch ($380 - 520\text{ Hz}$), wide-open resonant filter |
| **Urban Buildings / Metal Infrastructure** | Double-Bounce Corner Reflection | $-6\text{ dB}$ to $+2\text{ dB}$ (VV and VH very high) | Saturated white / light gray | Constant loud metallic tone, zero seasonal pitch modulation |

---

## 5. Practical Applications and Real-World Value

1. **All-Weather Crop Phenology and Food Security**:
   Allows agricultural ministries, insurance underwriters, and farmers to track exact emergence dates, peak canopy biomass, and harvest completion dates regardless of cloud cover, smoke, or weather conditions.
2. **Hydrological Management and Drought Assessment**:
   Identifies the extent of field flooding, canal irrigation delivery, and fallowed acreage during multi-year droughts (such as California's 2021 drought), providing water resource agencies with empirical ground-truth verification.
3. **Disaster and Flood Rapid Response**:
   Enables mapping of standing flood waters during extreme atmospheric river events (e.g., California 2017), differentiating permanent open water from temporary agricultural inundation.
4. **Multisensory Science Communication and Accessibility**:
   Provides blind and visually impaired researchers, students, and citizens with an intuitive acoustic pathway to explore Earth observation data, converting visual imagery into informative auditory telemetry.
5. **NISAR Mission Alignment**:
   Serves as a ready-to-deploy operational framework for ingest of L-band and S-band radar data from the NASA-ISRO Synthetic Aperture Radar (NISAR) satellite mission.

---

## 6. System Architecture

```
+-----------------------------------------------------------------------+
|                         Next.js 14 Frontend                           |
|                                                                       |
|  +--------------------+  +--------------------+  +-----------------+  |
|  |  Leaflet Map Engine|  | Web Audio Synth    |  | Telemetry &     |  |
|  |  - Custom Basemaps |  | - Polyphonic Osc   |  | Harmonic Chart  |  |
|  |  - Radar Overlays  |  | - Resonant Filter  |  | - Recharts / SVG|  |
|  |  - GPU Morph Shader|  | - ADSR Gain Node   |  | - Playhead Sync |  |
|  +--------------------+  +--------------------+  +-----------------+  |
+-----------------------------------^-----------------------------------+
                                    | REST API (JSON / PNG / WebP)
+-----------------------------------v-----------------------------------+
|                         FastAPI Backend                               |
|                                                                       |
|  +--------------------+  +--------------------+  +-----------------+  |
|  | Data Loader Service|  | Harmonic Engine    |  | Tile / Frame    |  |
|  | - Spatial Bounding |  | - 1st-Order Model  |  | Server           |  |
|  | - Pixel Sampling   |  | - 2nd-Order Model  |  | - Decadal Frames|  |
|  | - Radiometric Norm |  | - Fourier Fitting  |  | - Static Assets |  |
|  +--------------------+  +--------------------+  +-----------------+  |
+-----------------------------------------------------------------------+
```

---

## 7. REST API Documentation

### Base URL
* Local Development: `http://localhost:8080`
* Production: `https://your-cloud-run-service.a.run.app`

### Endpoints

#### `GET /api/health`
Returns system operational status, memory metrics, and active region catalogs.

#### `GET /api/regions`
Returns bounding boxes, center coordinates, and default display parameters for all monitored study areas.

#### `GET /api/pixel-history`
Extracts multi-temporal backscatter profiles and harmonic regression curves for a queried coordinate.
* Parameters:
  * `lat` (float, required): Latitude of query coordinate.
  * `lon` (float, required): Longitude of query coordinate.
  * `region` (string, required): `sacramento` or `punjab`.
* Returns:
  * `in_bounds` (boolean): Whether point falls inside the radar footprint.
  * `time_series` (array): Timestamps, VV, VH, VH/VV ratios, and calibrated dB values.
  * `harmonic` (object): Calculated amplitude, phase, mean power, and model $R^2$.
  * `sonification_params` (object): Base frequencies, filter envelope bounds, and suggested tempo.

#### `GET /api/heartbeat-overlay/{region}`
Streams pre-rendered false-color harmonic PNG mosaics formatted for direct slippy map bounds overlay.

#### `GET /api/decadal-manifest/{region}`
Returns ordered index of all 244 decadal satellite frames with calendar date timestamps, epoch indices, and metadata.

---

## 8. Installation and Local Setup

### 8.1 Prerequisites
* Python 3.10, 3.11, or 3.12
* Node.js 18+ and npm
* Git

### 8.2 Backend Setup
```bash
cd backend

# Create isolated Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install required dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run backend unit tests
PYTHONPATH=. python3 -m unittest discover tests

# Launch FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```
Interactive API documentation will be available at `http://localhost:8080/docs`.

### 8.3 Frontend Setup
```bash
cd frontend

# Install package dependencies
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 9. Verification and Test Suite

To execute the automated regression and unit test suite:
```bash
cd backend
PYTHONPATH=. .venv/bin/python -m unittest discover tests
```
The test suite validates:
* Dual-region bounding box coordinate spatial bounds checking.
* Out-of-bounds pixel rejection and graceful fallback generation.
* First-order Fourier harmonic fit accuracy on California rice profiles.
* Second-order dual-harmonic fit accuracy on Punjab crop profiles.
* Decadal frame manifest ordering and date interval continuity.
* Web Audio telemetry parameter range bounds.

---

## 10. Production Deployment

### 10.1 Backend: Google Cloud Run
The FastAPI container is designed for stateless execution with lightweight memory requirements (< 300 MB):
```bash
cd backend
gcloud run deploy land-heartbeat-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

### 10.2 Frontend: Vercel
Deploy the frontend repository directly through Vercel:
```bash
cd frontend
vercel --prod
```
Set the environment variable in your Vercel project settings:
```
NEXT_PUBLIC_API_URL=https://your-cloud-run-service.a.run.app
```

---

## 11. Data Sources and Citations

* **Copernicus Sentinel-1 Data**: European Space Agency (ESA) and European Commission Copernicus Open Access Hub.
* **Google Earth Engine**: Processing and spatial extraction via Google Earth Engine Earth Observation API.
* **Alaska Satellite Facility (ASF)**: NASA Distributed Active Archive Center (DAAC) for SAR data products.
* **NASA UAVSAR**: NASA Jet Propulsion Laboratory (JPL) Airborne L-band Synthetic Aperture Radar.
* **NASA-ISRO SAR (NISAR)**: Science definitions and polarimetric cal/val targets formulated by NASA JPL and ISRO SAC.

---

## 12. License

This project is licensed under the MIT License. Developed for the NASA Space Apps Challenge 2026.
