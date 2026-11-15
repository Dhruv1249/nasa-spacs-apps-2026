# Land Heartbeat & The Sound of the Land 🛰️🎶
> **NASA Space Apps Challenge 2026** — *Translating Satellite SAR Polarimetry & Phenological Cycles into Acoustic Music*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Cloud Run](https://img.shields.io/badge/Deploy-GCP%20Cloud%20Run-4285F4.svg?logo=google-cloud&logoColor=white)](https://cloud.google.com/run)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black.svg?logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🌟 Concept Overview

Earth breathes with a seasonal rhythm. Agricultural crops are planted, irrigated, grow lush canopies, and are harvested. 
**"Land Heartbeat & The Sound of the Land"** merges microwave radar remote sensing with interactive acoustic sonification:

1. **"Land Heartbeat" (Seasonal Fingerprinting)**:
   We fit a Fourier harmonic equation to every pixel's Synthetic Aperture Radar (SAR) backscatter time series across 365 days:
   $$y(t) = a_0 + a_1 \cos\left(\frac{2\pi t}{365}\right) + b_1 \sin\left(\frac{2\pi t}{365}\right)$$
   * **Phase ($\phi$) $\to$ Color Hue**: Identifies *when* the landscape peaks (Spring greening = greens; Summer rice = magenta/rose; Winter wheat = blues).
   * **Amplitude ($A$) $\to$ Color Saturation**: Measures *how intensely* the land fluctuates between bare ground and peak canopy (active rotational crops are vibrant; stable cities/highways are desaturated gray).
   * **Mean ($a_0$) $\to$ Brightness (Value)**: Measures average radar backscatter power (water bodies appear dark; forests/cities appear bright).

2. **"The Sound of the Land" (Interactive Sonification)**:
   Clicking anywhere on the map triggers an instant musical synthesis of that landscape's radar return over time via the browser's native **Web Audio API**:
   * **Pitch (Frequency)**: Mapped to cross-polarization biomass ($\text{HV}$ / $\text{VH}$ volume scattering).
   * **Timbre (Filter Cutoff)**: A dynamic low-pass filter opens as the crop canopy develops, transitioning from a muffled underwater hum (flooded field) to a bright, resonant treble chord (mature canopy).
   * **Volume (Gain)**: Proportional to total backscatter power in decibels ($\text{dB}$).
   * **Rhythm**: Steps through the satellite's orbital revisit cycle.

---

## 🌍 Dual-Region Showcase

| Feature | Sacramento Valley, California, USA | Indo-Gangetic Plain, Punjab, India |
| :--- | :--- | :--- |
| **Coordinates** | $38.83^\circ\text{ N}, 121.72^\circ\text{ W}$ | $30.90^\circ\text{ N}, 75.85^\circ\text{ E}$ |
| **Cropping Pattern** | Single-cycle flooded rice & walnut orchards | Intensive dual-crop rotation (Kharif Rice $\leftrightarrow$ Rabi Wheat) |
| **Acoustic Profile** | **Paddy Crescendo**: Spring sonar drop (flooding) $\to$ summer treble rise $\to$ sharp harvest drop. | **Rotational Arpeggio**: Two distinct harmonic heartbeats per year (March wheat & September rice). |
| **Significance** | Global testbed for airborne L-band (NASA UAVSAR) and precision hydrology. | Core joint NASA-ISRO validation epicenter for the NISAR satellite mission. |

---

## 🔬 Radar Physics: Why Does It Sound Like This?

* **Specular Reflection (Water Flooding)**:
  Smooth water behaves like a mirror to microwave pulses, reflecting them away from the satellite. Backscatter drops down to $-22\text{ dB}$ to $-28\text{ dB}$, generating near silence or a deep, resonant sub-bass drone.
* **Volume Scattering (Vegetation Canopy)**:
  Random leaves and vertical stems depolarize incoming waves ($\text{HH} \to \text{HV}$), raising the cross-pol ratio and driving pitch up from $140\text{ Hz}$ to $660\text{ Hz}$.
* **Double-Bounce Scattering (L-Band Speciality)**:
  At L-band ($\approx 24\text{ cm}$ wavelength, NISAR/UAVSAR), pulses penetrate through leaves to standing water beneath, bouncing off the water into the stalk and reflecting back to the sensor. This creates an intense acoustic chime that C-band ($\approx 5.6\text{ cm}$, Sentinel-1) cannot detect.

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │          Next.js 14 (Vercel)            │
                    │  • MapLibre / Leaflet Slippy Map        │
                    │  • Web Audio API Sonification Engine    │
                    │  • Synchronized SVG Time-Series Chart   │
                    │  • Physics Educational Drawer           │
                    └────────────────────┬────────────────────┘
                                         │ HTTP REST
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │      FastAPI Backend (GCP Cloud Run)    │
                    │  • 2 vCPU + 4 GB RAM Container          │
                    │  • Vectorized Harmonic Regression       │
                    │  • Fast Spatial Indexing & PNG Serving  │
                    │  • Acoustic Archetype Classification   │
                    └─────────────────────────────────────────┘
```

---

## 🚀 Quickstart: Running Locally

### 1. Prerequisites
* Python 3.10+
* Node.js 18+ and npm

### 2. Backend Setup (FastAPI)
```bash
cd backend

# Create virtual environment & install requirements
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run tests
PYTHONPATH=. python3 -m unittest discover tests

# Start FastAPI server (defaults to port 8080)
uvicorn app.main:app --reload --port 8080
```
API Documentation will be live at `http://localhost:8080/docs`.

### 3. Frontend Setup (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## ☁️ Production Deployment

### Backend: Google Cloud Run (GCP)
The backend container requires only **2 vCPU + 4 GB RAM** (operational memory is $< 300\text{ MB}$, and it scales to zero when idle):

```bash
cd backend
gcloud run deploy land-heartbeat-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2
```

### Frontend: Vercel
Deploy directly via the Vercel CLI or connect your GitHub repository:
```bash
cd frontend
vercel --prod
```
Set the environment variable in Vercel:
`NEXT_PUBLIC_API_URL=https://your-cloud-run-service.a.run.app`

---

## 📡 Sourcing Raw Satellite Data

To download additional raw SAR granules or scale to higher spatial resolutions:
* **NISAR L2 GCOV (L-band)**: Alaska Satellite Facility (ASF) Vertex (`search.asf.alaska.edu`) or via `asf_search` in Python with your NASA Earthdata login.
* **Sentinel-1 RTC (C-band)**: AWS Open Data Registry (`s3://sentinel-s1-rtc-indigo/`), free direct HTTPS download without credentials.
* **NASA UAVSAR (Airborne L-band)**: NASA JPL UAVSAR portal for Sacramento Valley flight lines.

Run the sourcing helper script:
```bash
python3 backend/scripts/fetch_data.py --guide
```

---

## 📄 License
MIT License. Created for the NASA Space Apps Challenge 2026.
