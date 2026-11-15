"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  MapPin,
  Sliders,
  Activity,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Layers,
  Radio,
  Check
} from "lucide-react";

interface ExplorerTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  badge: string;
  location: string;
  icon: React.ElementType;
  highlights: { title: string; desc: string }[];
  callout?: {
    type: "headphone" | "tip" | "science";
    text: string;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Land Heartbeat",
    subtitle: "Translating Satellite Microwave Radar into Sound & Earth Phenology",
    badge: "MISSION BRIEFING",
    location: "Getting Started",
    icon: Compass,
    highlights: [
      {
        title: "Multisensory Earth Observation",
        desc: "Land Heartbeat transforms 10 years of active synthetic aperture radar (SAR) from Sentinel-1 and the NASA-ISRO (NISAR) mission into both dynamic visual maps and musical acoustic sonification.",
      },
      {
        title: "Day-or-Night All-Weather Radar",
        desc: "Unlike optical satellites that are blocked by clouds and darkness, radar shoots microwave pulses to measure real surface roughness and soil dielectric moisture.",
      },
    ],
    callout: {
      type: "headphone",
      text: "HEADPHONES STRONGLY RECOMMENDED: For the best experience, please wear headphones. Our 32-bit polyphonic audio synthesizer uses microtonal frequencies and resonant spatial filter cutoffs to convey subtle moisture and crop canopy changes that are lost on standard laptop speakers.",
    },
  },
  {
    title: "Interactive Radar Map & GPU Morphing",
    subtitle: "High-Resolution Polarimetric Backscatter Canvas",
    badge: "CENTER VIEWPORT",
    location: "Main Screen Canvas",
    icon: MapPin,
    highlights: [
      {
        title: "Cyan Footprint Boundary",
        desc: "The dashed cyan rectangle outlines the calibrated Sentinel-1 SAR study footprint (Sacramento Valley, California or Punjab Agricultural Corridor, India).",
      },
      {
        title: "Click Any Parcel to Query",
        desc: "Click anywhere inside the cyan footprint to inspect that specific coordinate's multi-year dual-polarization backscatter history.",
      },
      {
        title: "WebGL Energy-Conserving Morphing",
        desc: "A persistent GPU fragment shader blends between radar satellite passes without map flicker or spatial displacement, keeping roads and parcels steady.",
      },
    ],
    callout: {
      type: "tip",
      text: "If you click outside the cyan footprint boundary, a recovery card will appear in the right panel with a one-click 'Click to Recenter' button.",
    },
  },
  {
    title: "Aerospace Tool Palette",
    subtitle: "Custom Underlays, Presets, and Phenology Layers",
    badge: "TOP-LEFT TOOL DOCK",
    location: "Left Vertical Dock",
    icon: Sliders,
    highlights: [
      {
        title: "Satellite Radar Layers",
        desc: "Toggle between the Harmonic Phenology Composite, individual seasonal passes, and historic climate extremes (2017 Floods, 2021 Drought, 2023 Snowmelt).",
      },
      {
        title: "Geographic Underlays",
        desc: "Switch between Google Satellite Hybrid, ESRI Optical Terrain, Cartographic Slate, and Topographic Relief under the radar overlay.",
      },
      {
        title: "Cal/Val Presets & Recenter",
        desc: "Jump instantly to verified ground targets (e.g. Sacramento Rice Basin, Woodland Orchards, Sutlej River) or re-center your view on the footprint.",
      },
    ],
  },
  {
    title: "Acoustic Sonifier & Scientific Telemetry",
    subtitle: "Live Microtonal Audio Synthesis and Dual-Pol Charts",
    badge: "RIGHT INSPECTOR DRAWER",
    location: "Right Collapsible Panel",
    icon: Activity,
    highlights: [
      {
        title: "Frequency & Filter Cutoff Telemetry",
        desc: "Frequency (Hz) scales with radar backscatter power (-30 dB to -5 dB). The low-pass filter cutoff (Hz) opens dynamically with canopy volume scattering (VH/VV ratio).",
      },
      {
        title: "Dual-Pol Time-Series Chart",
        desc: "Blue line represents VV co-polarization (surface roughness/water); Red line represents VH cross-polarization (canopy biomass); Black line shows the Fourier harmonic fit.",
      },
      {
        title: "Click & Scrub Timeline Seeking",
        desc: "Click or drag your cursor anywhere across the SVG time-series chart to jump to that exact date, hear its synthesized pitch, and morph the map.",
      },
    ],
    callout: {
      type: "science",
      text: "Water acts as a specular mirror reflecting microwaves away, creating deep bass drones. Dense vegetative canopies scatter waves in all directions, producing bright, overtone-rich tones.",
    },
  },
  {
    title: "Decadal Timeline & Playback Engine",
    subtitle: "Scrub Across 10 Years and 244 Orbital Passes",
    badge: "BOTTOM CONTROL BAR",
    location: "Bottom Screen Dock",
    icon: Clock,
    highlights: [
      {
        title: "Continuous Orbital Playback",
        desc: "Use the Play/Pause and Step Forward/Backward buttons to listen to the landscape's heartbeat evolve across calendar seasons.",
      },
      {
        title: "1-Year vs 10-Year Decadal Modes",
        desc: "Switch between the high-cadence 25-step 1-Year Seasonal Cycle and the complete 244-pass 10-Year Decadal Archive (2016-2026).",
      },
      {
        title: "Playback Speed Control",
        desc: "Adjust orbital playback speed from 0.25x to 2.0x for rapid decadal surveys or fine seasonal inspection.",
      },
    ],
    callout: {
      type: "tip",
      text: "You can reopen this tour at any time by clicking the 'Tour' button in the top navigation bar, or click 'Guide' to read the full SAR physics documentation.",
    },
  },
];

export const ExplorerTour: React.FC<ExplorerTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleFinish = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem("land_heartbeat_tour_seen", "true");
    }
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    handleFinish();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-3xl border border-ice shadow-2xl overflow-hidden font-mono flex flex-col text-navy"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-ice flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-coral bg-coral/10 px-2.5 py-1 rounded-full border border-coral/20">
              {step.badge}
            </span>
            <span className="text-[11px] text-sand-dark font-sans font-bold">
              Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={handleSkip}
            className="p-1.5 rounded-full text-sand-dark hover:text-navy hover:bg-canvas-subtle transition"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar Indicator */}
        <div className="w-full h-1 bg-ice/50">
          <div
            className="h-full bg-coral transition-all duration-300"
            style={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Main Title & Subtitle */}
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-coral/10 border border-coral/25 rounded-2xl text-coral shrink-0">
              <StepIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-navy tracking-tight font-sans">
                {step.title}
              </h2>
              <p className="text-xs text-sand-dark font-sans">
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Callout Box (Headphones / Science Tip) */}
          {step.callout && (
            <div
              className={`p-4 rounded-2xl border text-xs font-sans leading-relaxed flex items-start space-x-3 ${
                step.callout.type === "headphone"
                  ? "bg-coral/10 border-coral/30 text-navy font-medium shadow-xs"
                  : "bg-canvas-subtle border-ice text-navy/80"
              }`}
            >
              {step.callout.type === "headphone" ? (
                <Headphones className="w-5 h-5 text-coral shrink-0 mt-0.5 animate-pulse" />
              ) : (
                <Radio className="w-4 h-4 text-coral shrink-0 mt-0.5" />
              )}
              <div className="text-[11px] leading-relaxed">
                {step.callout.text}
              </div>
            </div>
          )}

          {/* Highlight Points */}
          <div className="space-y-3 font-sans">
            {step.highlights.map((h, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-canvas-subtle/80 border border-ice/60">
                <div className="w-1.5 h-1.5 rounded-full bg-coral mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-navy">{h.title}</div>
                  <div className="text-[11px] text-navy/70 leading-relaxed">{h.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-canvas-subtle/60 border-t border-ice flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center space-x-2 text-[11px] text-sand-dark font-sans cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-coral rounded border-ice cursor-pointer w-3.5 h-3.5"
            />
            <span>Do not show automatically again</span>
          </label>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-navy hover:bg-ice transition font-mono"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-coral hover:bg-coral-dark text-white shadow-sm shadow-coral/30 transition-all active:scale-[0.98] font-mono cursor-pointer"
            >
              <span>{isLast ? "Start Exploring" : "Next"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
