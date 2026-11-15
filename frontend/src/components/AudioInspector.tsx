"use client";

import React, { useEffect, useState, useRef } from "react";
import { PointQueryResponse } from "@/types";
import { RadarSonifier } from "@/audio/Sonifier";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  FastForward,
  Radio,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

interface AudioInspectorProps {
  data: PointQueryResponse | null;
  loading: boolean;
}

export const AudioInspector: React.FC<AudioInspectorProps> = ({ data, loading }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [speed, setSpeed] = useState<number>(1.0);

  const sonifierRef = useRef<RadarSonifier | null>(null);

  // Initialize sonifier instance
  useEffect(() => {
    const sonifier = new RadarSonifier();
    sonifier.setOnStepCallback((step) => {
      setActiveStep(step);
    });
    sonifierRef.current = sonifier;

    return () => {
      sonifier.stop();
    };
  }, []);

  // Update sonifier when point query data changes
  useEffect(() => {
    if (data && sonifierRef.current) {
      sonifierRef.current.setNoteEvents(data.sonification.note_events);
      setActiveStep(0);
      setIsPlaying(true);
      sonifierRef.current.play();
    }
  }, [data]);

  // Handle play/pause
  const togglePlay = () => {
    if (!sonifierRef.current || !data) return;
    if (isPlaying) {
      sonifierRef.current.pause();
      setIsPlaying(false);
    } else {
      sonifierRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if (!sonifierRef.current) return;
    sonifierRef.current.stop();
    setIsPlaying(false);
    setActiveStep(0);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (sonifierRef.current) sonifierRef.current.setVolume(v);
  };

  const handleSpeedChange = (s: number) => {
    setSpeed(s);
    if (sonifierRef.current) sonifierRef.current.setSpeed(s);
  };

  if (loading) {
    return (
      <aside className="w-full lg:w-96 bg-slate-950 border-l border-slate-800 p-6 flex flex-col items-center justify-center space-y-4">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Extracting radar time-series & harmonic signature...</p>
      </aside>
    );
  }

  if (!data) {
    return (
      <aside className="w-full lg:w-96 bg-slate-950 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-cyan-950/30 border border-cyan-800/40 rounded-2xl text-cyan-400">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-base font-semibold text-white">Select a Landscape Pixel</h3>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Click anywhere on the satellite map or pick a preset above to analyze its SAR backscatter rhythm and synthesize its seasonal acoustic song.
        </p>
      </aside>
    );
  }

  const { classification, harmonic, coordinates, time_series, sonification } = data;
  const currentNote = sonification.note_events[activeStep] || sonification.note_events[0];

  // SVG Chart Dimensions
  const chartWidth = 320;
  const chartHeight = 110;
  const minDb = -30;
  const maxDb = -5;

  const getX = (idx: number) => (idx / (time_series.length - 1)) * chartWidth;
  const getY = (val: number) => {
    const norm = (val - minDb) / (maxDb - minDb);
    return chartHeight - norm * chartHeight;
  };

  const copolPoints = time_series.map((pt, i) => `${getX(i)},${getY(pt.copol_dB)}`).join(" ");
  const crosspolPoints = time_series.map((pt, i) => `${getX(i)},${getY(pt.crosspol_dB)}`).join(" ");
  const fittedPoints = time_series.map((pt, i) => `${getX(i)},${getY(pt.fitted_dB)}`).join(" ");
  const activeX = getX(activeStep);

  return (
    <aside className="w-full lg:w-96 bg-slate-950/95 backdrop-blur-md border-l border-slate-800 flex flex-col h-full overflow-y-auto">
      {/* Classification Header */}
      <div className="p-5 border-b border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
            {classification.acoustic_archetype.replace("_", " ")}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {coordinates.lat.toFixed(3)}°N, {Math.abs(coordinates.lon).toFixed(3)}°W
          </span>
        </div>
        <h2 className="text-lg font-bold text-white">{classification.type}</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {classification.description}
        </p>
      </div>

      {/* Audio Playback Controls */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-lg shadow-cyan-500/20"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed & Volume */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-md">
              <FastForward className="w-3.5 h-3.5 text-slate-400" />
              {[0.5, 1.0, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-1.5 py-0.5 rounded ${speed === spd ? "bg-cyan-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Audio Telemetry Badge */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Pitch</div>
            <div className="text-xs font-bold text-cyan-400">{currentNote.frequency_hz} Hz</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Filter Cutoff</div>
            <div className="text-xs font-bold text-emerald-400">{currentNote.filter_cutoff_hz} Hz</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Date (DOY)</div>
            <div className="text-xs font-bold text-rose-400">{currentNote.date.slice(5)} ({currentNote.doy})</div>
          </div>
        </div>
      </div>

      {/* Synchronized Time-Series Chart */}
      <div className="p-5 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span>Backscatter & Harmonic Curve</span>
          <span className="text-[11px] text-slate-500 font-mono">dB vs Time</span>
        </div>

        <div className="relative w-full bg-slate-900/80 rounded-xl p-3 border border-slate-800 overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 overflow-visible">
            {/* Grid Lines */}
            <line x1="0" y1={getY(-10)} x2={chartWidth} y2={getY(-10)} stroke="#1f2937" strokeDasharray="3 3" />
            <line x1="0" y1={getY(-20)} x2={chartWidth} y2={getY(-20)} stroke="#1f2937" strokeDasharray="3 3" />

            {/* Fitted Harmonic Curve (Cyan Glow) */}
            <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.8" points={fittedPoints} />

            {/* Copol (VV / HH) Series (Emerald) */}
            <polyline fill="none" stroke="#10b981" strokeWidth="1.5" points={copolPoints} />

            {/* Crosspol (VH / HV) Series (Purple) */}
            <polyline fill="none" stroke="#a855f7" strokeWidth="1.2" strokeDasharray="4 2" points={crosspolPoints} />

            {/* Active Playhead Scanning Line */}
            <line x1={activeX} y1="0" x2={activeX} y2={chartHeight} stroke="#f43f5e" strokeWidth="2" />
            <circle cx={activeX} cy={getY(currentNote.copol_db)} r="4" fill="#f43f5e" />
          </svg>

          {/* Chart Legend */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Copol (HH/VV)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-purple-400 inline-block" /> Crosspol (HV/VH)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Harmonic Fit
            </span>
          </div>
        </div>
      </div>

      {/* Harmonic Parameters */}
      <div className="p-5 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" /> Harmonic Rhythm Metrics
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-slate-500 text-[11px]">Mean Backscatter (a₀)</div>
            <div className="text-white font-mono font-bold mt-0.5">{harmonic.a0.toFixed(2)} dB</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-slate-500 text-[11px]">Seasonal Swing (Amp)</div>
            <div className="text-white font-mono font-bold mt-0.5">±{harmonic.amplitude.toFixed(2)} dB</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-slate-500 text-[11px]">Peak Timing (Phase)</div>
            <div className="text-cyan-400 font-mono font-bold mt-0.5">DOY {Math.round(harmonic.phase_doy)}</div>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="text-slate-500 text-[11px]">Harmonic Fit (R²)</div>
            <div className="text-emerald-400 font-mono font-bold mt-0.5">{(harmonic.r_squared * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
