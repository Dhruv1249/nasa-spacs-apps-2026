"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SpotlightCard } from "@/components/animations/SpotlightCard";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { TextScramble } from "@/components/animations/TextScramble";
import { AudioSpectrogramVisualizer } from "@/components/animations/AudioSpectrogramVisualizer";
import { SarGeometryReticle } from "@/components/animations/SarGeometryReticle";
import {
  Satellite,
  Radio,
  Waves,
  Layers,
  BookOpen,
  Volume2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Calendar,
  Activity,
  Heart,
  Droplets,
  Sun,
  Eye,
  Shield,
  Compass,
  Zap,
  Sliders,
  CheckCircle2,
  Cpu,
  Database,
  ArrowUpRight,
  Play,
  RotateCcw,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

export default function HomePage() {
  const [activeAudienceTab, setActiveAudienceTab] = useState<"experts" | "literaries">("experts");

  // Forge Automotive Style: Interactive Stage Progression
  const [activePipelineStage, setActivePipelineStage] = useState<number>(0);

  // EnduroSat-Style Mission & Sonification Configurator State
  const [selectedSensor, setSelectedSensor] = useState<"sentinel1" | "nisar" | "fusion">("sentinel1");
  const [selectedRegion, setSelectedRegion] = useState<"sacramento" | "punjab">("sacramento");
  const [selectedModel, setSelectedModel] = useState<"fourier1" | "fourier2" | "anomaly">("fourier1");
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Derived telemetry based on Configurator choices
  const sensorSpecs = {
    sentinel1: {
      name: "Copernicus Sentinel-1 SAR",
      band: "C-Band (5.405 GHz)",
      wavelength: "5.55 cm",
      polarization: "Dual-Pol (VV + VH)",
      resolution: "10 m × 10 m",
      swath: "250 km (IW Mode)",
      baseFreq: 220,
    },
    nisar: {
      name: "NASA UAVSAR / NISAR SAR",
      band: "L-Band (1.25 GHz)",
      wavelength: "24.0 cm",
      polarization: "Quad-Pol (HH + HV + VV + VH)",
      resolution: "6 m × 6 m",
      swath: "240 km SweepSAR",
      baseFreq: 330,
    },
    fusion: {
      name: "Dual-Band Multi-Frequency Fusion",
      band: "C-Band + L-Band Joint Cal/Val",
      wavelength: "5.55 cm / 24.0 cm",
      polarization: "Multi-polarimetric Cross-Ratio",
      resolution: "Multi-scale 10 m",
      swath: "Synchronized Continental Track",
      baseFreq: 440,
    },
  };

  const regionSpecs = {
    sacramento: {
      name: "Sacramento Valley, California",
      coordinates: "38.8°N, 121.7°W",
      regime: "Single-Cycle Calrose Flooded Rice & Orchards",
      cadence: "15-day uniform (244 epochs)",
      peakDoy: "DOY 210 (August)",
      freqRange: "130 Hz (Flooding) → 490 Hz (Peak Canopy)",
    },
    punjab: {
      name: "Indo-Gangetic Plain, Punjab",
      coordinates: "30.9°N, 75.8°E",
      regime: "Intensive Kharif (Rice) - Rabi (Wheat) Rotation",
      cadence: "15-day uniform (244 epochs)",
      peakDoy: "DOY 105 (Rabi) & DOY 275 (Kharif)",
      freqRange: "180 Hz → 520 Hz (Bimodal Harmonic Arpeggio)",
    },
  };

  const currentSensor = sensorSpecs[selectedSensor];
  const currentRegion = regionSpecs[selectedRegion];

  // Pipeline stages data (Forge Automotive Showcase)
  const pipelineStages = [
    {
      num: "01",
      title: "Constellation Ingestion",
      tag: "MICROWAVE SENSOR STREAM",
      icon: Satellite,
      summary: "Direct ingestion of Level-1 Ground Range Detected (GRD) data from the Copernicus Sentinel-1 constellation and NASA UAVSAR airborne radar.",
      detail: "Unlike optical satellites restricted by clouds, haze, and solar angles, SAR transmits coherent gigahertz microwave bursts that pass uninhibited through atmospheric vapor and darkness to measure true physical dielectric surface properties.",
      specs: [
        { label: "FREQUENCY BAND", val: "5.405 GHz C-Band / 1.25 GHz L-Band" },
        { label: "SPATIAL RESOLUTION", val: "10m × 10m Pixel Grid" },
        { label: "SWATH COVERAGE", val: "250 km Interferometric Wide" },
        { label: "ATMOSPHERIC PENETRATION", val: "100% All-Weather / Day & Night" }
      ]
    },
    {
      num: "02",
      title: "Polarimetric Normalization",
      tag: "RADIOMETRIC CALIBRATION",
      icon: Waves,
      summary: "Radiometric calibration decodes sigma-nought (σ⁰ in dB) into decoupled surface roughness and volumetric biomass components.",
      detail: "Co-polarized waves (VV) measure surface roughness, moisture, and specular mirror dropouts (-26 dB during spring flooding), while cross-polarized waves (VH) capture multiple randomized bounces inside the 3D crop canopy (-12 dB at peak harvest).",
      specs: [
        { label: "CALIBRATION DOMAIN", val: "Radiometric Sigma-Nought (σ⁰ dB)" },
        { label: "DYNAMIC RANGE", val: "-28.0 dB (Specular) to +2.0 dB (Double Bounce)" },
        { label: "COPOL CHANNEL (VV)", val: "Hydrological Soil Moisture & Standing Water" },
        { label: "CROSSPOL CHANNEL (VH)", val: "Volumetric Vegetation Stalk Depolarization" }
      ]
    },
    {
      num: "03",
      title: "Dual-Frequency Harmonic Modeling",
      tag: "MATHEMATICAL FOURIER DECOMPOSITION",
      icon: Activity,
      summary: "Fitting multi-order Fourier harmonics to decadal time series isolates seasonal agricultural heartbeats from weather noise.",
      detail: "For single-cycle cropping (Sacramento), 1st-order Fourier models accurately isolate the annual vegetative pulse. In intensive multi-crop basins (Punjab), our 2nd-order harmonic regression (2ω, T = 182.6 days) eliminates destructive interference, elevating R² from 4% to over 88%.",
      specs: [
        { label: "REGRESSION SERIES", val: "y(t) = a₀ + ∑ [aₙ cos(nωt) + bₙ sin(nωt)]" },
        { label: "ANNUAL CYCLE (1ω)", val: "Period T = 365.25 Days (Sacramento)" },
        { label: "BI-ANNUAL CYCLE (2ω)", val: "Period T = 182.6 Days (Punjab Rotation)" },
        { label: "FIT ACCURACY", val: "R² > 88% Harmonic Correlation" }
      ]
    },
    {
      num: "04",
      title: "Psychoacoustic Synthesis Engine",
      tag: "REAL-TIME WEB AUDIO API",
      icon: Volume2,
      summary: "Synthesizing microwave backscatter into an immersive polyphonic auditory landscape with zero latency in any modern browser.",
      detail: "Decibels scale logarithmically to fundamental frequencies from 130 Hz (sub-bass sonar) to 520 Hz (bright treble). A dynamic biquad resonant filter opens wider as canopy volume grows, accompanied by ADSR exponential envelopes that eradicate transient clicks.",
      specs: [
        { label: "SYNTHESIS BITRATE", val: "32-Bit IEEE Floating Point" },
        { label: "FREQUENCY DOMAIN", val: "C3 (130.8 Hz) to C5 (523.3 Hz)" },
        { label: "RESONANT FILTER", val: "Biquad Low-Pass (Q = 3.5, 350 - 3150 Hz)" },
        { label: "CLIENT LATENCY", val: "0 ms Real-Time Audio Buffer" }
      ]
    }
  ];

  // Configurator Audio Pulse preview
  const playConfiguratorTone = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      const freq = currentSensor.baseFreq * (selectedRegion === "punjab" ? 1.25 : 1.0);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(selectedModel === "fourier2" ? 1800 : 900, ctx.currentTime);
      filter.Q.setValueAtTime(4.0, ctx.currentTime);

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      overtone.type = "triangle";
      overtone.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.08);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.9);

      osc.connect(filter);
      overtone.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      setIsSynthesizing(true);
      osc.start();
      overtone.start();

      osc.stop(ctx.currentTime + 0.95);
      overtone.stop(ctx.currentTime + 0.95);

      setTimeout(() => {
        setIsSynthesizing(false);
        ctx.close();
      }, 1000);
    } catch (e) {
      // Audio fallback
    }
  };

  return (
    <div className="min-h-screen bg-canvas bg-grid-pattern text-navy flex flex-col selection:bg-coral/20 selection:text-navy relative overflow-x-hidden">
      <Navbar />

      {/* Atmospheric Ambient Light Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-coral/[0.04] rounded-full blur-[150px] animate-shimmer-glow" />
        <div className="absolute top-32 right-1/4 w-[500px] h-[500px] bg-navy/[0.03] rounded-full blur-[150px] animate-shimmer-glow" style={{ animationDelay: "2.5s" }} />
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-36 relative z-10">
        {/* SECTION 1: FORGE-INSPIRED MONUMENTAL HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center pt-4 sm:pt-8">
          {/* Left Column: Monumental Editorial Statement */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <ScrollReveal direction="down" delayMs={50}>
              <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white border border-ice text-navy text-xs font-mono shadow-sm">
                <img src="/logo.png" alt="Land Heartbeat" className="w-4 h-4 object-contain" />
                <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-sand font-bold">
                  <TextScramble text="COPERNICUS SENTINEL-1 // NASA-ISRO NISAR CAL/VAL" speed={20} />
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={100}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-navy tracking-tight leading-[1.05]">
                EARTH OBSERVATION <br />
                <span className="animate-shiny-text font-black">
                  SPACE SERVICE
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={180}>
              <p className="text-base sm:text-lg text-navy/70 leading-relaxed max-w-xl font-normal">
                Translating 10 years of satellite Synthetic Aperture Radar (SAR) polarimetry into
                dual-frequency Fourier phenology models and real-time 32-bit acoustic sonification.
              </p>
            </ScrollReveal>

            {/* Hero CTAs */}
            <ScrollReveal direction="up" delayMs={240}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/explorer"
                  className="flex items-center justify-center space-x-3 px-8 py-4 rounded-full bg-coral hover:bg-coral-dark text-white font-bold text-xs sm:text-sm font-mono transition-all shadow-md shadow-coral/25 group"
                >
                  <span>LAUNCH GEOSPATIAL WORKSTATION</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>

                <Link
                  href="/catalog"
                  className="flex items-center justify-center space-x-2 px-6 py-4 rounded-full bg-white hover:bg-canvas-subtle text-navy text-xs font-mono border border-ice transition-all shadow-sm font-bold"
                >
                  <BookOpen className="w-4 h-4 text-coral" />
                  <span>3D DECADAL ATLAS (244 PASSES)</span>
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Orbital Reticle with Generous Spatial Framing */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal direction="none" delayMs={300}>
              <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-ice bg-white/90 backdrop-blur-xl p-3 shadow-2xl flex items-center justify-center animate-orbital-float">
                <div className="absolute inset-0 rounded-full border border-coral/30 animate-pulse-ring pointer-events-none" />
                <div className="absolute inset-0 rounded-full border border-navy/20 animate-pulse-ring-delayed pointer-events-none" />

                <div className="absolute w-3/4 h-3/4 rounded-full border border-ice" />
                <div className="absolute w-1/2 h-1/2 rounded-full border border-ice" />
                <div className="absolute w-1/4 h-1/4 rounded-full border border-ice" />

                <div className="absolute w-full h-px bg-ice" />
                <div className="absolute h-full w-px bg-ice" />

                {/* Radar Sweep Arc */}
                <div className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none">
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: "conic-gradient(from 0deg, rgba(248, 112, 96, 0.35) 0deg, rgba(248, 112, 96, 0.0) 45deg, transparent 360deg)",
                    }}
                  />
                  <div className="absolute top-0 left-1/2 w-px h-1/2 bg-coral" />
                </div>

                {/* Central Satellite Beacon */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-white border border-ice flex flex-col items-center justify-center shadow-lg p-2">
                  <img src="/logo.png" alt="Land Heartbeat" className="w-6 h-6 object-contain" />
                  <span className="text-[7px] font-mono font-bold text-navy mt-0.5">NISAR</span>
                </div>

                {/* Target Beacon 1: Sacramento */}
                <div className="absolute top-14 left-10 z-10 flex items-center space-x-1.5 font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping" />
                  <span className="text-[9px] text-navy font-bold bg-white/95 px-2 py-0.5 rounded border border-coral/30 shadow-sm">
                    SACRAMENTO 38.8°N
                  </span>
                </div>

                {/* Target Beacon 2: Punjab */}
                <div className="absolute bottom-16 right-8 z-10 flex items-center space-x-1.5 font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-navy animate-ping" />
                  <span className="text-[9px] text-navy font-bold bg-white/95 px-2 py-0.5 rounded border border-navy/30 shadow-sm">
                    PUNJAB 30.9°N
                  </span>
                </div>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 px-3 py-0.5 rounded-full bg-white/95 border border-ice text-[9px] font-mono text-sand font-bold shadow-sm">
                  SWATH 250 KM // RES 10M
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SECTION 2: FORGE-STYLE HORIZONTAL SPECIFICATION DATA STRIP */}
        <ScrollReveal direction="up" delayMs={50}>
          <div className="bg-white rounded-3xl border border-ice p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-ice">
              <div className="px-4 py-3 sm:px-6 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">Decadal Passes</div>
                <div className="text-3xl sm:text-4xl font-black text-navy font-mono">
                  <AnimatedCounter to={244} suffix=" Epochs" />
                </div>
                <div className="text-xs text-navy/60 font-sans">15-day uniform satellite revisit</div>
              </div>

              <div className="px-4 py-3 sm:px-6 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">Continuous Archive</div>
                <div className="text-3xl sm:text-4xl font-black text-navy font-mono">
                  <AnimatedCounter to={10} suffix=" Years" />
                </div>
                <div className="text-xs text-navy/60 font-sans">2016 – 2026 calibrated sigma-nought</div>
              </div>

              <div className="px-4 py-3 sm:px-6 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">Dual-Harmonic Fit</div>
                <div className="text-3xl sm:text-4xl font-black text-coral font-mono">
                  <AnimatedCounter to={88} prefix=">" suffix="% R²" />
                </div>
                <div className="text-xs text-navy/60 font-sans">2ω Fourier phenological model</div>
              </div>

              <div className="px-4 py-3 sm:px-6 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-widest text-sand font-bold">Audio Engine</div>
                <div className="text-3xl sm:text-4xl font-black text-navy font-mono">
                  <AnimatedCounter to={32} suffix="-Bit" />
                </div>
                <div className="text-xs text-navy/60 font-sans">Polyphonic Web Audio synthesis</div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* SECTION 3: FORGE-INSPIRED INTERACTIVE PIPELINE SHOWCASE (01 to 04) */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  01 // AEROSPACE DATA PIPELINE
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight font-mono">
                  From Microwave Echoes to Acoustic Perception
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Explore the four sequential transformations converting active satellite radar pulses into verified psychoacoustic frequencies.
              </p>
            </div>
          </ScrollReveal>

          {/* Interactive Stage Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            {pipelineStages.map((stg, idx) => {
              const isSelected = activePipelineStage === idx;
              return (
                <button
                  key={stg.num}
                  onClick={() => setActivePipelineStage(idx)}
                  className={`p-4 rounded-2xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-navy text-white border-navy shadow-md shadow-navy/20 font-bold"
                      : "bg-white hover:bg-canvas-subtle border-ice text-navy/70"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`text-[10px] tracking-wider uppercase block ${isSelected ? "text-coral" : "text-sand"}`}>
                      STAGE {stg.num}
                    </span>
                    <span className="text-xs font-bold font-sans truncate block">{stg.title}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-coral translate-x-1" : "text-sand"}`} />
                </button>
              );
            })}
          </div>

          {/* Large Uncluttered Active Stage Focus Card */}
          <ScrollReveal direction="up" delayMs={50}>
            {(() => {
              const current = pipelineStages[activePipelineStage];
              const IconComp = current.icon;
              return (
                <div className="bg-white rounded-3xl border border-ice p-8 sm:p-12 shadow-sm space-y-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-ice pb-8">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl sm:text-5xl font-black text-coral font-mono">
                        {current.num}
                      </span>
                      <div>
                        <span className="text-[10px] font-mono tracking-widest uppercase text-sand font-bold block">
                          {current.tag}
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-navy font-mono">
                          {current.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActivePipelineStage((prev) => (prev > 0 ? prev - 1 : pipelineStages.length - 1))}
                        className="px-4 py-2 rounded-full border border-ice text-xs font-mono font-bold text-navy hover:bg-canvas-subtle transition flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4 text-coral" />
                        <span>PREV STAGE</span>
                      </button>
                      <button
                        onClick={() => setActivePipelineStage((prev) => (prev < pipelineStages.length - 1 ? prev + 1 : 0))}
                        className="px-4 py-2 rounded-full border border-ice text-xs font-mono font-bold text-navy hover:bg-canvas-subtle transition flex items-center gap-1.5"
                      >
                        <span>NEXT STAGE</span>
                        <ChevronRight className="w-4 h-4 text-coral" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-7 space-y-4 font-sans">
                      <p className="text-base sm:text-lg font-semibold text-navy leading-relaxed">
                        {current.summary}
                      </p>
                      <p className="text-sm text-navy/70 leading-relaxed font-normal">
                        {current.detail}
                      </p>
                    </div>

                    <div className="lg:col-span-5 bg-canvas-subtle rounded-2xl p-6 border border-ice space-y-3 font-mono text-xs">
                      <div className="text-[10px] uppercase font-bold text-sand pb-1 border-b border-ice">
                        TECHNICAL SPECIFICATIONS
                      </div>
                      {current.specs.map((sp) => (
                        <div key={sp.label} className="flex justify-between items-center py-1.5 border-b border-ice/60">
                          <span className="text-sand">{sp.label}:</span>
                          <span className="font-bold text-navy text-right">{sp.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </ScrollReveal>
        </section>

        {/* SECTION 4: UNCLUTTERED MISSION CONFIGURATOR ATELIER */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  02 // MODULAR MISSION CONFIGURATOR
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight font-mono">
                  Configure Your Radar Observation &amp; Sonification
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Tailor satellite sensor payloads, target agricultural biospheres, and mathematical signal models.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Step Selectors with Generous Whitespace */}
            <div className="lg:col-span-7 space-y-8">
              {/* Step 1: Payload Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-navy flex items-center gap-2">
                    <Satellite className="w-4 h-4 text-coral" />
                    STEP 1 // SENSOR PAYLOAD SELECTION
                  </span>
                  <span className="text-sand text-[10px] font-bold">RADAR FREQUENCY</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedSensor("sentinel1")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedSensor === "sentinel1"
                        ? "bg-coral text-white border-coral font-bold shadow-md shadow-coral/20"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="text-[10px] opacity-80 uppercase">C-Band SAR</div>
                    <div className="font-bold text-sm mt-1">Sentinel-1</div>
                    <div className="text-[10px] opacity-75 mt-0.5">5.405 GHz // 10m</div>
                  </button>

                  <button
                    onClick={() => setSelectedSensor("nisar")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedSensor === "nisar"
                        ? "bg-coral text-white border-coral font-bold shadow-md shadow-coral/20"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="text-[10px] opacity-80 uppercase">L-Band SAR</div>
                    <div className="font-bold text-sm mt-1">NASA NISAR</div>
                    <div className="text-[10px] opacity-75 mt-0.5">1.25 GHz // Quad-Pol</div>
                  </button>

                  <button
                    onClick={() => setSelectedSensor("fusion")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedSensor === "fusion"
                        ? "bg-coral text-white border-coral font-bold shadow-md shadow-coral/20"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="text-[10px] opacity-80 uppercase">Multi-Band</div>
                    <div className="font-bold text-sm mt-1">Dual Fusion</div>
                    <div className="text-[10px] opacity-75 mt-0.5">C + L Joint Cal/Val</div>
                  </button>
                </div>
              </div>

              {/* Step 2: Target Biosphere */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-navy flex items-center gap-2">
                    <Compass className="w-4 h-4 text-coral" />
                    STEP 2 // TARGET BIOSPHERE &amp; ORBIT TRACK
                  </span>
                  <span className="text-sand text-[10px] font-bold">COORDINATES</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedRegion("sacramento")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedRegion === "sacramento"
                        ? "bg-navy text-white border-navy font-bold shadow-md shadow-navy/20"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">Sacramento Valley, USA</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${selectedRegion === "sacramento" ? "bg-white/20 text-white" : "bg-canvas-subtle text-sand"}`}>
                        38.8°N
                      </span>
                    </div>
                    <div className="text-xs opacity-80 mt-1.5 font-sans">
                      Single-cycle flooded Calrose rice &amp; tree nut orchards.
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedRegion("punjab")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedRegion === "punjab"
                        ? "bg-navy text-white border-navy font-bold shadow-md shadow-navy/20"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">Indo-Gangetic Plain, India</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${selectedRegion === "punjab" ? "bg-white/20 text-white" : "bg-canvas-subtle text-sand"}`}>
                        30.9°N
                      </span>
                    </div>
                    <div className="text-xs opacity-80 mt-1.5 font-sans">
                      Dual-cycle Kharif rice and Rabi winter wheat rotation.
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 3: Mathematical Model */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-navy flex items-center gap-2">
                    <Activity className="w-4 h-4 text-coral" />
                    STEP 3 // MATHEMATICAL HARMONIC DECOMPOSITION
                  </span>
                  <span className="text-sand text-[10px] font-bold">FOURIER ORDER</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedModel("fourier1")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedModel === "fourier1"
                        ? "bg-sand text-white border-sand font-bold shadow-md"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="text-[10px] opacity-80 uppercase">1st-Order Series</div>
                    <div className="font-bold text-sm mt-1">Single Peak (1ω)</div>
                    <div className="text-[10px] opacity-75 mt-0.5">T = 365 Days</div>
                  </button>

                  <button
                    onClick={() => setSelectedModel("fourier2")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedModel === "fourier2"
                        ? "bg-sand text-white border-sand font-bold shadow-md"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="text-[10px] opacity-80 uppercase">2nd-Order Series</div>
                    <div className="font-bold text-sm mt-1">Dual Peak (2ω)</div>
                    <div className="text-[10px] opacity-75 mt-0.5">T = 182.6 Days</div>
                  </button>

                  <button
                    onClick={() => setSelectedModel("anomaly")}
                    className={`p-4 rounded-2xl border text-left font-mono text-xs transition-all ${
                      selectedModel === "anomaly"
                        ? "bg-sand text-white border-sand font-bold shadow-md"
                        : "bg-white hover:bg-canvas-subtle border-ice text-navy"
                    }`}
                  >
                    <div className="text-[10px] opacity-80 uppercase">Climate Telemetry</div>
                    <div className="font-bold text-sm mt-1">Decadal Anomalies</div>
                    <div className="text-[10px] opacity-75 mt-0.5">2017 / 2021 / 2023</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Pinned Real-Time HUD */}
            <div className="lg:col-span-5 bg-white p-7 rounded-3xl border border-ice shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-ice">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
                  <span className="text-xs font-mono font-bold text-navy uppercase tracking-wider">
                    Telemetry HUD
                  </span>
                </div>
                <span className="text-[10px] font-mono text-sand bg-canvas-subtle px-2 py-0.5 rounded border border-ice font-bold">
                  VALIDATED ARCHITECTURE
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1.5 border-b border-ice/60">
                  <span className="text-sand">Active Sensor:</span>
                  <span className="text-navy font-bold">{currentSensor.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-ice/60">
                  <span className="text-sand">Wavelength / Band:</span>
                  <span className="text-navy font-bold">{currentSensor.band}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-ice/60">
                  <span className="text-sand">Spatial Resolution:</span>
                  <span className="text-navy font-bold">{currentSensor.resolution}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-ice/60">
                  <span className="text-sand">Target Region:</span>
                  <span className="text-navy font-bold">{currentRegion.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-ice/60">
                  <span className="text-sand">Phenology Regime:</span>
                  <span className="text-navy font-bold truncate max-w-[200px]">{currentRegion.regime}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-ice/60">
                  <span className="text-sand">Sonification Output:</span>
                  <span className="text-coral font-bold">{currentSensor.baseFreq} Hz Base ({currentRegion.freqRange.split("→")[1] || "High Treble"})</span>
                </div>
              </div>

              {/* Audio Synthesizer Pulse Button */}
              <div className="space-y-3 pt-3">
                <button
                  onClick={playConfiguratorTone}
                  disabled={isSynthesizing}
                  className={`w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-full font-mono text-xs font-bold transition-all shadow-md ${
                    isSynthesizing
                      ? "bg-navy text-white shadow-navy/20"
                      : "bg-coral hover:bg-coral-dark text-white shadow-coral/20"
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isSynthesizing ? "animate-spin" : ""}`} />
                  <span>{isSynthesizing ? "SYNTHESIZING SOUND OF LAND..." : "TEST ACOUSTIC HARMONIC PULSE"}</span>
                </button>

                <Link
                  href={`/explorer?region=${selectedRegion}`}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-full font-mono text-xs text-navy bg-canvas-subtle hover:bg-ice transition-all border border-ice font-bold"
                >
                  <span>LAUNCH THIS CONFIGURATION IN WORKSTATION</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-coral" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: INTERACTIVE LABORATORY DEMONSTRATORS */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  03 // INTERACTIVE LABORATORY
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight font-mono">
                  Real-Time Oscilloscope &amp; Scattering Geometry
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Manipulate seasonal revisit days and observe instantaneous changes in backscatter decibels, wave geometry, and acoustic harmonics.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ScrollReveal direction="right" delayMs={50}>
              <AudioSpectrogramVisualizer />
            </ScrollReveal>

            <ScrollReveal direction="left" delayMs={50}>
              <SarGeometryReticle />
            </ScrollReveal>
          </div>
        </section>

        {/* SECTION 6: COMPARATIVE STUDY SITES */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  04 // COMPARATIVE STUDY SITES
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight font-mono">
                  Two Contrasting Agricultural Regimes
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Compare single-cycle North American rice irrigation against intensive South Asian dual-crop rotations.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sacramento Valley */}
            <ScrollReveal direction="right" delayMs={80}>
              <div className="bg-white rounded-3xl border border-ice p-8 space-y-6 flex flex-col justify-between h-full shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-navy bg-canvas-subtle px-3 py-1 rounded-full border border-ice">
                      USA · [-121.90, 38.68, -121.55, 38.98]
                    </span>
                    <span className="text-[9px] text-coral uppercase font-mono font-bold">NASA UAVSAR CAL/VAL</span>
                  </div>
                  <h3 className="text-2xl font-bold text-navy font-mono">Sacramento Valley, California</h3>
                  <p className="text-sm text-navy/70 leading-relaxed font-sans">
                    Characterized by single-season flooded Calrose rice paddies and orchard complexes.
                    Spring field flooding creates deep specular reflection drops (-24 dB), followed by explosive summer canopy growth
                    and an autumn harvest crescendo.
                  </p>
                  <div className="bg-canvas-subtle p-4 rounded-2xl border border-ice space-y-2 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-sand">Cropping:</span> <span className="text-navy font-bold">Single-cycle flooded rice</span></div>
                    <div className="flex justify-between"><span className="text-sand">Harmonic Model:</span> <span className="text-coral font-bold">1st-Order Single Annual Peak (Aug-Sep)</span></div>
                    <div className="flex justify-between"><span className="text-sand">Acoustic Signature:</span> <span className="text-navy font-bold">Deep sonar dive to high summer swell</span></div>
                  </div>
                </div>
                <Link
                  href="/explorer?region=sacramento"
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-full bg-navy hover:bg-navy-light text-white text-xs font-mono font-bold transition-all shadow-sm shadow-navy/20 group"
                >
                  <span>INSPECT SACRAMENTO IN WORKSTATION</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>

            {/* Indo-Gangetic Plain */}
            <ScrollReveal direction="left" delayMs={80}>
              <div className="bg-white rounded-3xl border border-ice p-8 space-y-6 flex flex-col justify-between h-full shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-navy bg-canvas-subtle px-3 py-1 rounded-full border border-ice">
                      India · [75.70, 30.75, 76.05, 31.05]
                    </span>
                    <span className="text-[9px] text-coral uppercase font-mono font-bold">NASA-ISRO NISAR EPICENTER</span>
                  </div>
                  <h3 className="text-2xl font-bold text-navy font-mono">Indo-Gangetic Plain, Punjab</h3>
                  <p className="text-sm text-navy/70 leading-relaxed font-sans">
                    The agricultural food basket of South Asia. Farmers operate an intensive dual-crop rotation:
                    Kharif monsoon rice (June–October) alternating with Rabi winter wheat (November–April).
                    Features two distinct phenological heartbeats and acoustic peaks per calendar year.
                  </p>
                  <div className="bg-canvas-subtle p-4 rounded-2xl border border-ice space-y-2 text-xs font-mono">
                    <div className="flex justify-between"><span className="text-sand">Cropping:</span> <span className="text-navy font-bold">Kharif (Rice) - Rabi (Wheat) rotation</span></div>
                    <div className="flex justify-between"><span className="text-sand">Harmonic Model:</span> <span className="text-coral font-bold">2nd-Order Dual Peak (Mar/Apr &amp; Sep/Oct)</span></div>
                    <div className="flex justify-between"><span className="text-sand">Acoustic Signature:</span> <span className="text-navy font-bold">Rapid rhythmic arpeggio oscillating twice/year</span></div>
                  </div>
                </div>
                <Link
                  href="/explorer?region=punjab"
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-full bg-navy hover:bg-navy-light text-white text-xs font-mono font-bold transition-all shadow-sm shadow-navy/20 group"
                >
                  <span>INSPECT PUNJAB IN WORKSTATION</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SECTION 7: MULTIDISCIPLINARY TRANSLATION */}
        <ScrollReveal direction="up" delayMs={100}>
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-ice space-y-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-ice pb-6">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block mb-1">
                  05 // MULTIDISCIPLINARY TRANSLATION
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-navy tracking-tight font-mono">
                  Scientific Precision &amp; Literary Articulation
                </h2>
              </div>

              {/* Segmented Tabs */}
              <div className="flex items-center bg-canvas-subtle p-1 rounded-full border border-ice text-xs font-mono">
                <button
                  onClick={() => setActiveAudienceTab("experts")}
                  className={`px-5 py-2 rounded-full transition-all ${
                    activeAudienceTab === "experts"
                      ? "bg-coral text-white font-bold shadow-sm shadow-coral/25"
                      : "text-sand hover:text-navy"
                  }`}
                >
                  SCIENTIFIC SPECIFICATION
                </button>
                <button
                  onClick={() => setActiveAudienceTab("literaries")}
                  className={`px-5 py-2 rounded-full transition-all ${
                    activeAudienceTab === "literaries"
                      ? "bg-coral text-white font-bold shadow-sm shadow-coral/25"
                      : "text-sand hover:text-navy"
                  }`}
                >
                  LITERARY INTERPRETATION
                </button>
              </div>
            </div>

            {activeAudienceTab === "experts" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-navy/90">
                <div className="bg-canvas-subtle p-6 rounded-2xl border border-ice space-y-3 font-mono">
                  <div className="font-bold text-navy text-sm flex items-center gap-2">
                    <Waves className="w-4 h-4 text-coral" />
                    CALIBRATED POLARIMETRY
                  </div>
                  <p className="text-navy/70 leading-relaxed font-sans text-xs">
                    Level-1 Ground Range Detected (GRD) scenes retrieved from ESA Copernicus Sentinel-1.
                    Normalized to sigma-nought (σ⁰ in dB) across dual polarizations: VV (surface roughness/moisture)
                    and VH (volumetric canopy scattering).
                  </p>
                </div>

                <div className="bg-canvas-subtle p-6 rounded-2xl border border-ice space-y-3 font-mono">
                  <div className="font-bold text-navy text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-coral-dark" />
                    FOURIER HARMONIC DECOMPOSITION
                  </div>
                  <p className="text-navy/70 leading-relaxed font-sans text-xs">
                    Employs 1st-order Fourier series for unimodal Sacramento rice cycles and
                    2nd-order dual-frequency harmonic regressions (2ω, period T = 182.6 days) for intensive bimodal rotations (Punjab),
                    eliminating destructive interference and elevating R² fit from 4% to &gt;88%.
                  </p>
                </div>

                <div className="bg-canvas-subtle p-6 rounded-2xl border border-ice space-y-3 font-mono">
                  <div className="font-bold text-navy text-sm flex items-center gap-2">
                    <Radio className="w-4 h-4 text-navy" />
                    NISAR L-BAND DOUBLE-BOUNCE
                  </div>
                  <p className="text-navy/70 leading-relaxed font-sans text-xs">
                    Cross-validated with NASA UAVSAR L-band data. Longer 24 cm wavelengths penetrate dense foliage
                    to elicit corner-reflector scattering from inundated root zones, producing brilliant acoustic resonant chimes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-navy/90">
                <div className="bg-canvas-subtle p-6 rounded-2xl border border-ice space-y-3 font-mono">
                  <div className="font-bold text-navy text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-coral" />
                    THE LIVING CADENCE OF THE BASIN
                  </div>
                  <p className="text-navy/70 leading-relaxed font-sans text-xs">
                    Like an acoustic stethoscope against the chest of the continent, radar pulses measure the cyclical breath of agricultural basins—from the silent specular mirror of spring irrigation to the dense acoustic resonance of mature summer canopies.
                  </p>
                </div>

                <div className="bg-canvas-subtle p-6 rounded-2xl border border-ice space-y-3 font-mono">
                  <div className="font-bold text-navy text-sm flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-coral" />
                    MICROWAVE SYMPHONY
                  </div>
                  <p className="text-navy/70 leading-relaxed font-sans text-xs">
                    Specular water dropouts resound as deep, muffled sub-bass frequencies (130 Hz). As stalks emerge and leaves branch, the low-pass resonant filter opens wide, elevating the pitch into an open, bright treble crescendo (520 Hz).
                  </p>
                </div>

                <div className="bg-canvas-subtle p-6 rounded-2xl border border-ice space-y-3 font-mono">
                  <div className="font-bold text-navy text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-coral-dark" />
                    INCLUSIVE SENSORY EXPLORATION
                  </div>
                  <p className="text-navy/70 leading-relaxed font-sans text-xs">
                    By uncoupling satellite data from purely visual cartography, Land Heartbeat democratizes Earth observation for visually impaired students, scientists, and researchers, transforming complex backscatter curves into intuitive auditory landscapes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* SECTION 8: READY TO DISCOVER CTA */}
        <ScrollReveal direction="up">
          <div className="bg-white rounded-3xl p-10 sm:p-16 text-center space-y-6 border border-ice shadow-sm">
            <h2 className="text-3xl sm:text-5xl font-black text-navy tracking-tight font-mono">
              OPEN MULTI-SENSORY EARTH OBSERVATION
            </h2>
            <p className="text-navy/70 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
              Experience how Synthetic Aperture Radar pierces atmospheric interference to connect human auditory perception with the seasonal pulse of the continents.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/explorer"
                className="flex items-center space-x-2 px-8 py-4 rounded-full bg-coral hover:bg-coral-dark text-white font-bold text-xs sm:text-sm font-mono transition shadow-md shadow-coral/25"
              >
                <span>OPEN WORKSTATION</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/science"
                className="flex items-center space-x-2 px-7 py-4 rounded-full bg-canvas-subtle hover:bg-ice text-navy text-xs sm:text-sm font-mono border border-ice transition font-bold"
              >
                <BookOpen className="w-4 h-4 text-coral" />
                <span>SCIENTIFIC SPECIFICATION</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>

      {/* Sleek Minimalist Aerospace Footer */}
      <footer className="border-t border-ice bg-white py-10 px-4 sm:px-6 lg:px-8 text-xs text-sand font-mono mt-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-4 h-4 text-coral" />
            <span className="font-bold text-navy tracking-wider uppercase text-[11px]">
              LAND HEARTBEAT // THE SOUND OF THE LAND
            </span>
            <span className="text-sand">· NASA SPACE APPS 2026</span>
          </div>
          <div className="flex items-center space-x-8 text-[11px] uppercase font-bold">
            <Link href="/" className="hover:text-coral transition text-navy">Overview</Link>
            <Link href="/explorer" className="hover:text-coral transition text-navy">Explorer</Link>
            <Link href="/catalog" className="hover:text-coral transition text-navy">Catalog</Link>
            <Link href="/science" className="hover:text-coral transition text-navy">Science</Link>
            <Link href="/about" className="hover:text-coral transition text-navy">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
