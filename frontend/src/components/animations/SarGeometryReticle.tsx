"use client";

import React, { useState } from "react";
import { Satellite, Shield, Layers, Radio, Compass } from "lucide-react";

export const SarGeometryReticle: React.FC = () => {
  const [selectedRegime, setSelectedRegime] = useState<"specular" | "volume" | "double_bounce" | "roughness">("volume");

  const regimes = {
    volume: {
      name: "Volumetric Canopy Scattering",
      sensor: "VH / HV Cross-Polarization",
      physics: "Multiple random reflections within multi-tier leaves and stalks depolarize incident vertical waves into horizontal components.",
      db: "-12.0 to -7.0 dB",
      freq: "420 - 520 Hz (High Treble Swell)",
      color: "text-coral font-bold",
      badgeColor: "bg-coral/10 text-coral border-coral/30",
    },
    specular: {
      name: "Specular Inundation Dropout",
      sensor: "VV / HH Co-Polarization",
      physics: "Smooth standing irrigation water functions as a mirror, deflecting radar pulse energy away from the satellite antenna.",
      db: "-26.0 to -22.0 dB",
      freq: "130 - 150 Hz (Sub-Bass Sonar Hum)",
      color: "text-navy font-bold",
      badgeColor: "bg-navy/10 text-navy border-navy/30",
    },
    double_bounce: {
      name: "Double-Bounce Corner Reflection",
      sensor: "L-Band NISAR Enhanced",
      physics: "Microwaves bounce off standing water into vertical crop stalks and directly back to sensor with near-zero power attenuation.",
      db: "-6.0 to +2.0 dB",
      freq: "520 Hz + Resonant 2nd Harmonic Chime",
      color: "text-coral-dark font-bold",
      badgeColor: "bg-coral/15 text-coral-dark border-coral/40",
    },
    roughness: {
      name: "Surface Roughness Diffuse Return",
      sensor: "VV Co-Polarization",
      physics: "Plowed dry clods and bare soil scatter microwave energy isotropically back toward the antenna aperture.",
      db: "-16.0 to -12.0 dB",
      freq: "200 - 240 Hz (Foundational Mid-Tone)",
      color: "text-sand-dark font-bold",
      badgeColor: "bg-sand/15 text-sand-dark border-sand/30",
    },
  };

  const active = regimes[selectedRegime];

  return (
    <div className="spotlight-card p-6 border border-ice bg-white text-navy relative space-y-5">
      {/* Precision corner reticles */}
      <span className="absolute top-2.5 left-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>
      <span className="absolute top-2.5 right-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>
      <span className="absolute bottom-2.5 left-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>
      <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-ice">
        <div className="flex items-center space-x-2">
          <Satellite className="w-4 h-4 text-coral" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-navy font-bold">
            Orbital Swath Geometry &amp; Polarimetry
          </span>
        </div>
        <span className="text-[10px] font-mono text-sand-dark bg-canvas-subtle px-2 py-0.5 rounded border border-ice">
          ALT 693 KM // INCIDENCE 38.4°
        </span>
      </div>

      {/* Interactive Regime Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(regimes) as (keyof typeof regimes)[]).map((key) => {
          const isSelected = selectedRegime === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedRegime(key)}
              className={`p-2.5 rounded-xl text-left font-mono text-[11px] transition-all border ${
                isSelected
                  ? "bg-coral text-white border-coral font-bold shadow-sm shadow-coral/25"
                  : "bg-canvas-subtle border-ice text-sand-dark hover:text-navy hover:border-ice-dark"
              }`}
            >
              <div className={`text-[9px] uppercase ${isSelected ? "text-white/80" : "text-sand-dark"}`}>{key.replace("_", " ")}</div>
              <div className="truncate font-bold mt-0.5">{regimes[key].name.split(" ")[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Detailed Geometry Diagram Card */}
      <div className="bg-canvas-subtle p-5 rounded-2xl border border-ice space-y-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono font-bold tracking-wider ${active.color}`}>
            // {active.name.toUpperCase()}
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${active.badgeColor}`}>
            {active.sensor}
          </span>
        </div>

        <p className="text-xs text-navy/80 leading-relaxed font-normal">
          {active.physics}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-ice text-xs font-mono">
          <div>
            <div className="text-[9px] uppercase text-sand-dark">Backscatter Coefficient</div>
            <div className="font-bold text-navy mt-0.5">{active.db}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-sand-dark">Acoustic Sonification Map</div>
            <div className={`font-bold mt-0.5 ${active.color}`}>{active.freq}</div>
          </div>
        </div>
      </div>

      {/* Polarimetric Scattering Matrix Readout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-sand-dark pt-1">
        <span>POLARIMETRIC SCATTERING MATRIX [S]:</span>
        <div className="bg-canvas-subtle px-3 py-1.5 rounded-lg border border-ice text-navy font-bold">
          [ S_vv : S_vh ] · [ S_hv : S_hh ] // INTERFEROMETRIC WIDE (IW)
        </div>
      </div>
    </div>
  );
};
