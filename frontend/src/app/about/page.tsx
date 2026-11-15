"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  Info,
  Radio,
  Globe,
  Heart,
  ExternalLink,
  Code2,
  Compass,
  Satellite,
  ShieldCheck,
  CheckCircle2,
  Layers
} from "lucide-react";

export default function AboutPage() {
  const sensorPartners = [
    {
      sensor: "Copernicus Sentinel-1",
      org: "European Space Agency (ESA)",
      band: "C-Band (5.405 GHz / 5.55 cm)",
      desc: "Primary constellation providing continuous Level-1 GRD dual-polarimetric (VV/VH) radar coverage with uniform 15-day revisit cadence."
    },
    {
      sensor: "NASA UAVSAR / NISAR",
      org: "NASA JPL & ISRO",
      band: "L-Band (1.25 GHz / 24.0 cm)",
      desc: "Deep-penetration microwave radar validating sub-canopy inundation and double-bounce corner reflection in dense agricultural root zones."
    },
    {
      sensor: "SRTM 30m Digital Elevation",
      org: "NASA & NGA",
      band: "Elevation Contour Model",
      desc: "Radiometric terrain correction and incidence angle normalization to resolve geometric distortions across sloped topography."
    },
    {
      sensor: "Google Earth Engine",
      org: "Earth Science Big Data Cloud",
      band: "Cloud Compute Ingestion",
      desc: "Massive parallel array reduction and multi-temporal array sampling across 10 years of calibrated decadal satellite passes."
    }
  ];

  return (
    <div className="min-h-screen bg-canvas bg-grid-pattern text-navy flex flex-col selection:bg-coral/20 selection:text-navy">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-28">
        {/* Monumental Editorial Header */}
        <ScrollReveal direction="down">
          <div className="space-y-4 border-b border-ice pb-10">
            <div className="flex items-center space-x-2.5 text-sand text-xs font-mono uppercase tracking-widest font-bold">
              <Info className="w-4 h-4 text-coral" />
              <span>Mission Overview &amp; Research Rationale</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-navy tracking-tight font-mono">
              The Sound of the Land
            </h1>
            <p className="text-base sm:text-lg text-navy/70 max-w-3xl leading-relaxed font-sans font-normal">
              Developed for the <strong>NASA Space Apps Challenge 2026</strong>. Translating 10 years of satellite Synthetic Aperture Radar (SAR) backscatter into interactive spatial cartography and real-time acoustic sonification.
            </p>
          </div>
        </ScrollReveal>

        {/* SECTION 1: THE CORE VISION (Forge Editorial Split Layout) */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  01 // THE VISION
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-navy tracking-tight font-mono leading-tight">
                  Listening to the Living Breath of the Continents
                </h2>
              </div>

              <div className="lg:col-span-7 space-y-6 text-sm sm:text-base text-navy/80 leading-relaxed font-sans font-normal">
                <p>
                  Every year, Earth oscillates through profound seasonal rhythms. Croplands flood with spring irrigation,
                  surge into thick green canopies under the summer sun, and yield to autumn harvest. Yet, for much of the planet,
                  persistent clouds, monsoon storms, and nighttime darkness obscure these transformations from conventional optical cameras.
                </p>
                <p>
                  By utilizing Synthetic Aperture Radar (SAR) pulses from the Copernicus Sentinel-1 constellation and NASA UAVSAR / NISAR missions,
                  we bypass the atmospheric veil. But rather than restricting this critical telemetry to complex technical tables,
                  <strong className="text-navy font-bold"> Land Heartbeat transforms microwave scattering physics into an auditory language</strong>.
                  Now, anyone can listen to the growth, flooding, and ripening of our living agricultural basins.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION 2: MULTISENSORY ACCESSIBILITY & DATA VERIFICATION */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  02 // MULTISENSORY IMPERATIVE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight font-mono">
                  Accessibility &amp; Cognitive Advantage
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Why converting microwave backscatter into sound enhances remote sensing for all researchers.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal direction="right" delayMs={50}>
              <div className="bg-white rounded-3xl border border-ice p-8 sm:p-10 space-y-4 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-coral font-mono text-xs font-bold">
                    <Heart className="w-4 h-4" />
                    <span>INCLUSIVE EARTH OBSERVATION</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-navy font-mono">
                    Universal Data Democratization
                  </h3>
                  <p className="text-xs sm:text-sm text-navy/70 leading-relaxed font-sans font-normal">
                    Traditional remote sensing relies almost exclusively on visual screens. For blind and visually impaired students, educators, and researchers, satellite observation has historically been inaccessible. Land Heartbeat transforms microwave decibels into audible pitch, resonance, and tempo, unlocking Earth observation through inclusive auditory exploration.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="left" delayMs={50}>
              <div className="bg-white rounded-3xl border border-ice p-8 sm:p-10 space-y-4 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-coral font-mono text-xs font-bold">
                    <Radio className="w-4 h-4" />
                    <span>PSYCHOACOUSTIC ADVANTAGE</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-navy font-mono">
                    Acoustic Temporal Pattern Detection
                  </h3>
                  <p className="text-xs sm:text-sm text-navy/70 leading-relaxed font-sans font-normal">
                    The human auditory system possesses an extraordinary capacity to detect subtle microtonal deviations, rhythm breaks, and harmonic shifts. By sonifying 10-year decadal time series, scientists can immediately flag drought anomalies, delayed monsoon floods, or harvest disruptions far faster than scanning tabular spreadsheets.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* SECTION 3: SENSOR DATA PROVENANCE (Forge Architecture Strip) */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-ice pb-6">
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  03 // DATA PROVENANCE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-navy tracking-tight font-mono">
                  Sensor Constellations &amp; Data Pipeline
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-navy/70 max-w-md font-sans">
                Rigorous spaceborne and airborne radar calibration workflows.
              </p>
            </div>
          </ScrollReveal>

          <div className="bg-white rounded-3xl border border-ice p-6 sm:p-10 shadow-sm divide-y divide-ice">
            {sensorPartners.map((item, idx) => (
              <div key={item.sensor} className={`py-6 first:pt-0 last:pb-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center`}>
                <div className="lg:col-span-4 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-sand font-bold block">
                    {item.org}
                  </span>
                  <h4 className="text-lg font-bold text-navy font-mono">{item.sensor}</h4>
                  <span className="text-xs text-coral font-mono font-bold block">{item.band}</span>
                </div>
                <div className="lg:col-span-8 text-xs sm:text-sm text-navy/70 leading-relaxed font-sans font-normal">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: TECHNICAL ARCHITECTURE & OPEN SCIENCE */}
        <section className="space-y-8">
          <ScrollReveal direction="up">
            <div className="bg-white rounded-3xl border border-ice p-8 sm:p-12 shadow-sm space-y-8">
              <div className="space-y-2 border-b border-ice pb-6">
                <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-coral font-bold block">
                  04 // ARCHITECTURAL STANDARDS
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-navy font-mono">
                  Open Source &amp; High-Performance Engine
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-sans">
                <div className="space-y-2">
                  <span className="font-bold text-navy text-sm block font-mono">Next.js 14 Frontend</span>
                  <p className="text-navy/70 leading-relaxed font-normal">
                    GPU-accelerated Radar Morph Canvas, Leaflet geospatial mapping, and client-side Web Audio API polyphonic oscillators.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-navy text-sm block font-mono">FastAPI Backend</span>
                  <p className="text-navy/70 leading-relaxed font-normal">
                    High-performance spatial querying, multi-order Fourier regression, and radiometric decibel calibration engine running on Python 3.12.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-navy text-sm block font-mono">Open Source (MIT)</span>
                  <p className="text-navy/70 leading-relaxed font-normal">
                    Built transparently for the global scientific and educational community under the permissive MIT Open Source License.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Action Link to Explorer */}
          <ScrollReveal direction="up" delayMs={100}>
            <div className="pt-8 border-t border-ice flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
              <span className="text-xs text-sand font-bold">
                Experience the acoustic landscape in real-time:
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
