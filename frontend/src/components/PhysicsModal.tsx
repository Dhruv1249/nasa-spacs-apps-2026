import React from "react";
import { X, Radio, Waves, ShieldCheck, Sun, Layers } from "lucide-react";

interface PhysicsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhysicsModal: React.FC<PhysicsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-ice rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 font-mono text-navy">
        <div className="flex items-center justify-between border-b border-ice pb-4">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-5 h-5 text-coral" />
            <h2 className="text-lg font-bold text-navy">How It Works: SAR Radar Physics &amp; Sonification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-sand-dark hover:text-navy hover:bg-canvas-subtle transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: SAR Basics */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-coral flex items-center gap-1.5">
            <Waves className="w-4 h-4" /> Synthetic Aperture Radar (SAR) Principles
          </h3>
          <p className="text-xs text-navy/80 leading-relaxed font-sans font-normal">
            Unlike optical cameras that take photos using reflected sunlight, <strong>SAR actively emits microwave pulses</strong> down to Earth and records the echoed signal (backscatter in decibels, dB). Radar waves pass through clouds, haze, and darkness, revealing physical moisture, roughness, and 3D canopy geometry.
          </p>
        </div>

        {/* Section 2: Polarizations */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-coral" /> Why Do Polarizations (HH, HV, VV, VH) Matter?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-canvas-subtle p-4 rounded-xl border border-ice font-sans">
              <span className="font-bold text-navy block mb-1 font-mono">Water Flooding (Specular Reflection)</span>
              Smooth water surfaces act like mirrors, reflecting microwave pulses away from the radar antenna. Backscatter plunges down to -22 dB to -28 dB (represented as quiet, low bass).
            </div>
            <div className="bg-canvas-subtle p-4 rounded-xl border border-ice font-sans">
              <span className="font-bold text-coral block mb-1 font-mono">Vegetation Canopy (Volume Scattering)</span>
              As crops grow, radar waves bounce multiple times within random leaves and stalks, rotating wave polarization (HV/VH surges). This translates to rising musical pitch and filter opening.
            </div>
          </div>
        </div>

        {/* Section 3: L-Band vs C-Band */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-coral-dark flex items-center gap-1.5">
            <Sun className="w-4 h-4" /> L-Band (NISAR/UAVSAR) vs C-Band (Sentinel-1)
          </h3>
          <p className="text-xs text-navy/80 leading-relaxed font-sans font-normal">
            <strong>L-band (24 cm wavelength)</strong> penetrates through dense crop foliage down to the underlying soil or standing water. When rice paddies are flooded under tall stalks, L-band experiences <strong>double-bounce scattering</strong> (bouncing off water into the stalk and straight back to the satellite), producing a brilliant acoustic resonant chime that shorter C-band (5.6 cm) cannot achieve.
          </p>
        </div>

        {/* Section 4: Harmonic Fit */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-coral" /> The &quot;Land Heartbeat&quot; Harmonic Math
          </h3>
          <p className="text-xs text-navy/80 leading-relaxed font-sans font-normal">
            We model every pixel&apos;s annual radar curve using a first-order Fourier harmonic:
            <code className="block bg-canvas-subtle p-2.5 my-2 rounded font-mono text-[11px] text-coral font-bold border border-ice">
              y(t) = a₀ + a₁·cos(2π·t / 365) + b₁·sin(2π·t / 365)
            </code>
            <strong>Phase (φ)</strong> indicates the exact day-of-year the field reaches peak biomass (Color Hue). <strong>Amplitude (A)</strong> measures how intensely the land fluctuates between bare ground and peak canopy (Color Saturation).
          </p>
        </div>

        <div className="pt-2 border-t border-ice flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-coral hover:bg-coral-dark text-white font-bold text-xs rounded-xl transition shadow-md shadow-coral/20 font-mono"
          >
            Got it, Let&apos;s Explore!
          </button>
        </div>
      </div>
    </div>
  );
};
