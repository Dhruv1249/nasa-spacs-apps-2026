"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Activity, Radio, Volume2, Waves } from "lucide-react";

interface AudioSpectrogramVisualizerProps {
  className?: string;
}

export const AudioSpectrogramVisualizer: React.FC<AudioSpectrogramVisualizerProps> = ({
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDoy, setActiveDoy] = useState(180);
  const animationFrameRef = useRef<number>();
  const [phase, setPhase] = useState(0);

  // Derived telemetry based on DOY (Rice phenology in Sacramento)
  const normCanopy = Math.max(0, Math.sin(((activeDoy - 80) / 280) * Math.PI));
  const currentVv = +(-22 + normCanopy * 12).toFixed(1);
  const currentVh = +(-26 + normCanopy * 15).toFixed(1);
  const currentRatio = +(currentVv - currentVh).toFixed(1);
  const frequencyHz = Math.round(130.8 + Math.pow(normCanopy, 1.3) * 392.4);
  const filterCutoffHz = Math.round(350 + normCanopy * 2400);

  // Continuous sinusoidal oscillation for live oscilloscope
  useEffect(() => {
    let currentPhase = 0;
    const animate = () => {
      currentPhase += isPlaying ? 0.08 : 0.015;
      setPhase(currentPhase);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  // Handle Play/Stop with native Web Audio synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  const toggleSound = () => {
    if (typeof window === "undefined") return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    if (isPlaying) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsPlaying(false);
    } else {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterCutoffHz, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequencyHz, ctx.currentTime);

      overtone.type = "triangle";
      overtone.frequency.setValueAtTime(frequencyHz * 2, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);

      osc.connect(filter);
      overtone.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      overtone.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
      filterRef.current = filter;
      setIsPlaying(true);
    }
  };

  // Update audio parameters on DOY scrub
  useEffect(() => {
    if (audioCtxRef.current && isPlaying && oscRef.current && filterRef.current) {
      const t = audioCtxRef.current.currentTime;
      oscRef.current.frequency.setTargetAtTime(frequencyHz, t, 0.05);
      filterRef.current.frequency.setTargetAtTime(filterCutoffHz, t, 0.05);
    }
  }, [activeDoy, frequencyHz, filterCutoffHz, isPlaying]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Generate 64-point oscilloscope curve
  const width = 420;
  const height = 120;
  const points = Array.from({ length: 64 }, (_, i) => {
    const x = (i / 63) * width;
    const amp = 20 + normCanopy * 28;
    const freqMod = (frequencyHz / 200) * 0.12;
    const y = height / 2 + Math.sin(i * freqMod + phase) * amp;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className={`spotlight-card p-6 space-y-5 border border-ice bg-white text-navy relative ${className}`}>
      {/* Precision Corner Reticle Marks */}
      <span className="absolute top-2.5 left-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>
      <span className="absolute top-2.5 right-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>
      <span className="absolute bottom-2.5 left-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>
      <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono text-ice-dark select-none">+</span>

      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-ice">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse shadow-sm shadow-coral/40" />
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-navy font-bold">
            SAR Acoustic Oscilloscope
          </span>
        </div>
        <span className="text-[10px] font-mono text-sand-dark bg-canvas-subtle px-2 py-0.5 rounded border border-ice">
          LEVEL-1 GRD // DUAL-POL
        </span>
      </div>

      {/* Oscilloscope Canvas */}
      <div className="relative w-full h-32 bg-canvas-subtle rounded-xl border border-ice overflow-hidden flex items-center justify-center shadow-inner">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 pointer-events-none opacity-40">
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-r border-b border-ice" />
          <div className="border-b border-ice" />
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <polyline
            fill="none"
            stroke="#f87060"
            strokeWidth="2.5"
            points={points}
            strokeLinecap="round"
          />
        </svg>

        {/* Live Frequency Badge Overlay */}
        <div className="absolute top-2.5 right-3 font-mono text-[10px] text-navy bg-white/95 px-2.5 py-1 rounded-lg border border-ice shadow-sm">
          <span className="text-coral font-bold">{frequencyHz} Hz</span> · Q=3.5 · LPF {filterCutoffHz} Hz
        </div>
      </div>

      {/* Interactive Temporal Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-sand-dark">Phenological Revisit Epoch:</span>
          <span className="text-navy font-bold">DOY {activeDoy} // CALENDAR CYCLE</span>
        </div>
        <input
          type="range"
          min="1"
          max="365"
          value={activeDoy}
          onChange={(e) => setActiveDoy(parseInt(e.target.value))}
          className="w-full accent-coral cursor-pointer h-2 bg-ice rounded-lg appearance-none"
        />
        <div className="flex items-center justify-between text-[9px] font-mono text-sand-dark">
          <span>JAN (DOY 01)</span>
          <span>MAY (INUNDATION)</span>
          <span>AUG (PEAK CANOPY)</span>
          <span>NOV (POST-HARVEST)</span>
        </div>
      </div>

      {/* Telemetry Readouts */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-1">
        <div className="bg-canvas-subtle p-2.5 rounded-xl border border-ice">
          <div className="text-[9px] uppercase text-sand-dark">VV (Copol)</div>
          <div className="font-bold text-navy mt-0.5">{currentVv} dB</div>
        </div>
        <div className="bg-canvas-subtle p-2.5 rounded-xl border border-ice">
          <div className="text-[9px] uppercase text-sand-dark">VH (Crosspol)</div>
          <div className="font-bold text-coral mt-0.5">{currentVh} dB</div>
        </div>
        <div className="bg-canvas-subtle p-2.5 rounded-xl border border-ice">
          <div className="text-[9px] uppercase text-sand-dark">Depol Ratio</div>
          <div className="font-bold text-sand-dark mt-0.5">{currentRatio} dB</div>
        </div>
        <div className="bg-canvas-subtle p-2.5 rounded-xl border border-ice">
          <div className="text-[9px] uppercase text-sand-dark">Synthesis</div>
          <div className="font-bold text-navy mt-0.5">{frequencyHz} Hz</div>
        </div>
      </div>

      {/* Audio Play Trigger */}
      <div className="pt-2 flex items-center justify-between">
        <button
          onClick={toggleSound}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold font-mono transition-all ${
            isPlaying
              ? "bg-navy hover:bg-navy-light text-white shadow-md shadow-navy/20"
              : "bg-coral hover:bg-coral-dark text-white shadow-md shadow-coral/20"
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? "STOP OSCILLATOR" : "LISTEN TO EPOCH"}</span>
        </button>

        <span className="text-[10px] font-mono text-sand-dark">
          32-BIT IEEE FLOAT // NATIVE WEB AUDIO
        </span>
      </div>
    </div>
  );
};
