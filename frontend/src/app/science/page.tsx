"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  BookOpen,
  Waves,
  Layers,
  Radio,
  Sun,
  Activity,
  Sparkles,
  ExternalLink,
  Volume2,
  ChevronRight,
  Play,
  CheckCircle2,
  Sliders
} from "lucide-react";

export default function SciencePage() {
  const [selectedRegime, setSelectedRegime] = useState<number>(0);

  // Forge Automotive Style: Interactive Scattering Regimes Explorer
  const scatteringRegimes = [
    {
      num: "01",
      name: "Specular Inundation",
      feature: "Calm Standing Water / Flooded Rice Fields",
      sensor: "VV / HH Co-Polarization",
      dbRange: "-28.0 to -22.0 dB",
      toneHz: "130 - 150 Hz (Sub-Bass Sonar Hum)",
      physics: "Smooth water acts as a specular mirror, reflecting almost all incoming gigahertz microwave pulses away from the satellite antenna aperture.",
      acousticSignature: "Deep subterranean sonar hum with a heavily attenuated low-pass filter cutoff (350 Hz), evoking the sensation of looking into an underwater abyss.",
      colorSignature: "Deep specular navy / cobalt blue in multitemporal composites.",
    },
    {
      num: "02",
      name: "Surface Roughness",
      feature: "Bare Tilled Soil / Fallowed Farmland",
      sensor: "VV Co-Polarization",
      dbRange: "-16.0 to -12.0 dB",
      toneHz: "200 - 240 Hz (Foundational Mid-Tone)",
      physics: "Plowed dry clods and surface micro-topography comparable to radar wavelength scatter microwave energy isotropically back toward the antenna.",
      acousticSignature: "Mid-register foundational acoustic tone with balanced harmonic presence, reflecting the quiet dormancy of bare earth before germination.",
      colorSignature: "Warm bronze / earthen ochre representing mineral roughness.",
    },
    {
      num: "03",
      name: "Volume Canopy Scattering",
      feature: "Dense Crop Canopy / Mature Vegetation",
      sensor: "VH / HV Cross-Polarization",
      dbRange: "-12.0 to -7.0 dB",
      toneHz: "420 - 520 Hz (Bright Treble Crescendo)",
      physics: "Microwave pulses enter the dense multi-tier canopy and undergo multiple random reflections between leaves and stalks, rotating wave polarization.",
      acousticSignature: "Bright, airy treble crescendo with an open low-pass filter cutoff (up to 3150 Hz), mimicking the lush vitality of mature agricultural biomass.",
      colorSignature: "Vibrant emerald green to deep crimson denoting maximum photosynthetic canopy.",
    },
    {
      num: "04",
      name: "Double-Bounce Reflection",
      feature: "Inundated Stalks / Urban Structures",
      sensor: "L-Band NISAR Enhanced / Quad-Pol",
      dbRange: "-6.0 to +2.0 dB",
      toneHz: "520 Hz + Resonant 2nd Harmonic Chime",
      physics: "Microwaves bounce off standing water into vertical crop stalks and straight back to the satellite with near-zero power attenuation.",
      acousticSignature: "Resonant, ringing bell chime with high harmonic saturation and prolonged sustain, indicative of deep canopy water penetration.",
      colorSignature: "Brilliant saturated white / golden yellow highlight.",
    },
  ];

  const activeRegime = scatteringRegimes[selectedRegime];

  return (
    <div className="min-h-screen bg-canvas bg-grid-pattern text-navy flex flex-col selection:bg-coral/20 selection:text-navy">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-28">
        {/* Editorial Monumental Header */}
        <ScrollReveal direction="down">
          <div className="space-y-4 border-b border-ice pb-10">
            <div className="flex items-center space-x-2.5 text-sand text-xs font-mono uppercase tracking-widest font-bold">
              <BookOpen className="w-4 h-4 text-coral" />
              <span>Scientific &amp; Mathematical Specification</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-navy tracking-tight font-mono">
              Electromagnetics &amp; Harmonic Theory
            </h1>
            <p className="text-base sm:text-lg text-navy/70 max-w-3xl leading-relaxed font-sans">
              Bridging active microwave scattering physics, multi-order Fourier phenology regression, and psychoacoustic Web Audio synthesis.
            </p>
          </div>
        </ScrollReveal>

        {/* SECTION 1: INTERACTIVE SCATTERING MECHANISMS EXPLORER */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  01 // ELECTROMAGNETIC SCATTERING PHYSICS
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight font-mono">
                  Four Primary Microwave Scattering Regimes
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Select an interaction mode below to inspect its physical mechanics, decibel response, and acoustic timbre.
              </p>
            </div>
          </ScrollReveal>

          {/* Interactive Regime Selector Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            {scatteringRegimes.map((reg, idx) => {
              const isSelected = selectedRegime === idx;
              return (
                <button
                  key={reg.num}
                  onClick={() => setSelectedRegime(idx)}
                  className={`p-4 rounded-2xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-navy text-white border-navy shadow-md shadow-navy/20 font-bold"
                      : "bg-white hover:bg-canvas-subtle border-ice text-navy/70"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className={`text-[10px] tracking-wider uppercase block ${isSelected ? "text-coral" : "text-sand"}`}>
                      REGIME {reg.num}
                    </span>
                    <span className="text-xs font-bold font-sans truncate block">{reg.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-coral translate-x-1" : "text-sand"}`} />
                </button>
              );
            })}
          </div>

          {/* Large Uncluttered Active Regime Showcase */}
          <ScrollReveal direction="up" delayMs={50}>
            <div className="bg-white rounded-3xl border border-ice p-8 sm:p-12 shadow-sm space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-ice pb-8">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl sm:text-4xl font-black text-coral font-mono">
                      {activeRegime.num}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-navy font-mono">
                      {activeRegime.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-sand font-bold block pt-1">
                    TARGET: {activeRegime.feature.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="bg-canvas-subtle px-4 py-2 rounded-xl border border-ice text-navy font-bold">
                    {activeRegime.sensor}
                  </div>
                  <div className="bg-coral/10 px-4 py-2 rounded-xl border border-coral/30 text-coral font-bold">
                    {activeRegime.dbRange}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 font-sans">
                <div className="lg:col-span-7 space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-sand font-bold">
                      Physical Scattering Mechanism:
                    </h4>
                    <p className="text-sm sm:text-base text-navy/80 leading-relaxed font-normal">
                      {activeRegime.physics}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-sand font-bold">
                      Psychoacoustic Timbre &amp; Sonification:
                    </h4>
                    <p className="text-sm sm:text-base text-navy/80 leading-relaxed font-normal">
                      {activeRegime.acousticSignature}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-canvas-subtle rounded-2xl p-6 border border-ice space-y-4 font-mono text-xs">
                  <div className="text-[10px] uppercase font-bold text-sand pb-1 border-b border-ice">
                    ACOUSTIC TELEMETRY MAPPING
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Synthesized Pitch:</span>
                      <span className="font-bold text-navy">{activeRegime.toneHz}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Typical Backscatter:</span>
                      <span className="font-bold text-coral">{activeRegime.dbRange}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Polarization Channel:</span>
                      <span className="font-bold text-navy">{activeRegime.sensor}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Cartographic Hue:</span>
                      <span className="font-bold text-navy truncate max-w-[180px]">{activeRegime.colorSignature}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION 2: HARMONIC PHENOLOGY MATHEMATICAL MODELING */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  02 // MATHEMATICAL PHENOLOGY
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight font-mono">
                  Multi-Order Fourier Harmonic Modeling
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Sinusoidal decomposition isolates cyclic crop biomass fluctuations from anomalous meteorological interference.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Single-Crop Model (Sacramento) */}
            <ScrollReveal direction="right" delayMs={50}>
              <div className="bg-white rounded-3xl border border-ice p-8 space-y-6 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy uppercase tracking-wider font-mono">
                      Single-Crop Model (Sacramento)
                    </span>
                    <span className="text-[10px] font-mono text-sand bg-canvas-subtle px-3 py-1 rounded-full border border-ice font-bold">
                      1st-Order Fourier
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-navy/70 leading-relaxed font-sans font-normal">
                    Designed for unimodal agricultural regimes such as California flooded Calrose rice, where field flooding in spring is followed by steady summer growth and a single harvest peak in August.
                  </p>

                  <div className="bg-canvas-subtle p-4 rounded-2xl border border-ice font-mono text-xs text-coral font-bold">
                    y(t) = a₀ + a₁·cos(ω·t) + b₁·sin(ω·t)
                  </div>

                  <div className="space-y-2 text-xs font-mono text-navy/80">
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Fundamental Frequency (ω):</span>
                      <span className="font-bold text-navy">2π / 365.25 rad/day</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Seasonal Amplitude (A₁):</span>
                      <span className="font-bold text-navy">√(a₁² + b₁²) [dB Swing]</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Peak Timing (φ₁):</span>
                      <span className="font-bold text-navy">atan2(b₁, a₁) [DOY Phase]</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Dual-Crop Model (Punjab) */}
            <ScrollReveal direction="left" delayMs={50}>
              <div className="bg-white rounded-3xl border border-ice p-8 space-y-6 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy uppercase tracking-wider font-mono">
                      Dual-Crop Model (Punjab)
                    </span>
                    <span className="text-[10px] font-mono text-coral bg-coral/10 px-3 py-1 rounded-full border border-coral/30 font-bold">
                      2nd-Order Harmonic (2ω)
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-navy/70 leading-relaxed font-sans font-normal">
                    In the Indo-Gangetic Plain, farmers rotate Kharif monsoon rice (summer) with Rabi wheat (winter). A 1st-order model yields destructive interference ($R^2 \approx 4\%$). Our 2nd-order formulation restores fit accuracy.
                  </p>

                  <div className="bg-canvas-subtle p-4 rounded-2xl border border-ice font-mono text-xs text-coral font-bold">
                    y(t) = a₀ + a₁·cos(ωt) + b₁·sin(ωt) + a₂·cos(2ωt) + b₂·sin(2ωt)
                  </div>

                  <div className="space-y-2 text-xs font-mono text-navy/80">
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Second Harmonic (2ω):</span>
                      <span className="font-bold text-navy">Period T = 182.6 Days</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Fit Correlation Gain:</span>
                      <span className="font-bold text-coral">Elevated from 4% to &gt;88%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-ice/60">
                      <span className="text-sand">Auditory Profile:</span>
                      <span className="font-bold text-navy">Dual annual acoustic arpeggio</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SECTION 3: COLORIMETRIC & PSYCHOACOUSTIC ARCHITECTURE */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  03 // SENSORY TRANSLATION
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight font-mono">
                  Color Space &amp; Audio Synthesis Architecture
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Converting mathematical coefficients into intuitive visual and acoustic representations.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-ice p-6 space-y-3 shadow-sm">
              <div className="text-xs font-mono font-bold text-sand uppercase">01 // HUE CYLINDER</div>
              <h3 className="font-mono font-bold text-base text-navy">Phase to Hue (H)</h3>
              <div className="text-xs text-coral font-mono font-bold">H = (φ mod 2π) / 2π</div>
              <p className="text-xs text-navy/70 leading-relaxed font-sans font-normal">
                Encodes the exact calendar day of peak biomass. Spring emerald transitions to summer rose and autumn harvest gold.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-ice p-6 space-y-3 shadow-sm">
              <div className="text-xs font-mono font-bold text-sand uppercase">02 // SATURATION</div>
              <h3 className="font-mono font-bold text-base text-navy">Amplitude to Saturation (S)</h3>
              <div className="text-xs text-coral font-mono font-bold">S = min(1.0, A₁ / 6.0 dB)</div>
              <p className="text-xs text-navy/70 leading-relaxed font-sans font-normal">
                Reflects vegetative dynamic swing. High-amplitude rotational crops appear vivid and saturated; static built structures remain neutral gray.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-ice p-6 space-y-3 shadow-sm">
              <div className="text-xs font-mono font-bold text-sand uppercase">03 // BRIGHTNESS</div>
              <h3 className="font-mono font-bold text-base text-navy">Mean Power to Value (V)</h3>
              <div className="text-xs text-navy font-mono font-bold">V = clip((a₀ - μ_min) / Δμ, 0.1, 1.0)</div>
              <p className="text-xs text-navy/70 leading-relaxed font-sans font-normal">
                Reflects total annual microwave backscatter. Specular open water appears deeply dark; urban complexes illuminate brightly.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: REAL-TIME WEB AUDIO SYNTHESIS */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="bg-white rounded-3xl border border-ice p-8 sm:p-12 shadow-sm space-y-8">
              <div className="space-y-2 border-b border-ice pb-6">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  04 // PSYCHOACOUSTIC AUDIO PIPELINE
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-navy font-mono">
                  Client-Side Polyphonic Web Audio Engine
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-sans">
                <div className="space-y-3">
                  <span className="font-bold text-navy text-sm block font-mono">1. Exponential Pitch Scaling</span>
                  <p className="text-navy/70 leading-relaxed font-normal">
                    Backscatter decibels scale logarithmically from C3 (130.8 Hz) to C5 (523.3 Hz), ensuring equal perceived pitch steps for equal decibel changes.
                  </p>
                  <div className="bg-canvas-subtle p-3 rounded-xl font-mono text-[11px] text-coral font-bold border border-ice">
                    f(t) = f_min · (f_max / f_min)^norm(VH)
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="font-bold text-navy text-sm block font-mono">2. Resonant Biquad Filter</span>
                  <p className="text-navy/70 leading-relaxed font-normal">
                    A dynamic low-pass filter (Q = 3.5) opens from 350 Hz to 3150 Hz as vegetation canopy thickens, creating a bright, resonant timbre.
                  </p>
                  <div className="bg-canvas-subtle p-3 rounded-xl font-mono text-[11px] text-coral font-bold border border-ice">
                    cutoff = 350 + 2800 · norm(VH)
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="font-bold text-navy text-sm block font-mono">3. ADSR Gain Enveloping</span>
                  <p className="text-navy/70 leading-relaxed font-normal">
                    Smooth exponential attack and release gain stages prevent acoustic click transients as the playhead advances through discrete satellite epochs.
                  </p>
                  <div className="bg-canvas-subtle p-3 rounded-xl font-mono text-[11px] text-navy font-bold border border-ice">
                    gain(t) = linearRamp(0.01 → 0.3)
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Action Link to Explorer */}
          <ScrollReveal direction="up" delayMs={100}>
            <div className="pt-8 border-t border-ice flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
              <span className="text-xs text-sand font-bold">
                Experience these physics and equations interactively:
              </span>
              <Link
                href="/explorer"
                className="flex items-center space-x-2 px-7 py-3.5 rounded-full bg-coral hover:bg-coral-dark text-white font-bold text-xs font-mono transition shadow-md shadow-coral/20"
              >
                <span>Launch Geospatial Workstation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>
    </div>
  );
}
