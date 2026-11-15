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
  MapPin,
  Plus,
  Minus,
} from "lucide-react";

interface AudioInspectorProps {
  data: PointQueryResponse | null;
  loading: boolean;
  onActiveEpochChange?: (date: string, doy: number, seasonFrame: string) => void;
}

export const AudioInspector: React.FC<AudioInspectorProps> = ({ data, loading, onActiveEpochChange }) => {
  const [timelineMode, setTimelineMode] = useState<"annual" | "decadal">("annual");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [speed, setSpeed] = useState<number>(1.0);

  const sonifierRef = useRef<RadarSonifier | null>(null);

  const hasDecadal = Boolean(data?.decadal_time_series && data.decadal_time_series.length > 0);
  const isDecadal = timelineMode === "decadal" && hasDecadal;

  const activeSeries = isDecadal ? data!.decadal_time_series! : (data?.time_series || []);
  const activeSonification = isDecadal ? data!.decadal_sonification : data?.sonification;
  const activeNotes = activeSonification?.note_events || [];

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

  // Update sonifier when point query data or mode changes
  useEffect(() => {
    if (data && !data.is_out_of_bounds && sonifierRef.current && activeNotes.length > 0) {
      // Slower, more deliberate default cadence
      sonifierRef.current.setBaseNoteDuration(isDecadal ? 0.18 : 0.32);
      sonifierRef.current.setNoteEvents(activeNotes);
      setActiveStep(0);
      if (isPlaying) {
        sonifierRef.current.play();
      }
    }
  }, [data, timelineMode]);

  // Synchronize active epoch with parent map overlay (high-density multi-photo timeline)
  useEffect(() => {
    if (!activeNotes || activeNotes.length === 0 || !onActiveEpochChange) return;
    const note = activeNotes[activeStep] || activeNotes[0];
    if (note) {
      let frameId = "harmonic";
      if (timelineMode === "annual") {
        // Map directly to 24 individual bi-weekly satellite radar photos
        frameId = `epoch_${String(activeStep % 24).padStart(2, "0")}`;
      } else {
        // 10-Year Decadal Mode: map year & phenological phase + climate anomalies
        const year = note.date.slice(0, 4);
        const epochInYear = Math.min(23, Math.max(0, Math.floor((note.doy / 365.0) * 24)));
        frameId = `epoch_${String(epochInYear).padStart(2, "0")}`;

        if (year === "2017" && (note.doy < 150 || note.doy > 320)) {
          frameId = "climate_2017_flood";
        } else if (year === "2021") {
          frameId = "climate_2021_drought";
        } else if (year === "2023" && note.doy < 160) {
          frameId = "climate_2023_snow";
        }
      }
      onActiveEpochChange(note.date, note.doy, frameId);
    }
  }, [activeStep, activeNotes, timelineMode, onActiveEpochChange]);

  // Handle play/pause on user click (guarantees AudioContext is running)
  const togglePlay = async () => {
    if (!sonifierRef.current || !data || data.is_out_of_bounds) return;
    if (isPlaying) {
      sonifierRef.current.pause();
      setIsPlaying(false);
    } else {
      await sonifierRef.current.ensureAudioRunning();
      await sonifierRef.current.play();
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

  if (data.is_out_of_bounds) {
    return (
      <aside className="w-full lg:w-96 bg-slate-950 border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl text-amber-400">
          <MapPin className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="text-base font-semibold text-white">Outside SAR Coverage Footprint</h3>
        <div className="bg-amber-950/30 p-3.5 rounded-xl border border-amber-800/40 text-left space-y-2">
          <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
            {data.message}
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Footprint bounds: [{data.bounds?.join(", ")}]
          </div>
        </div>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
          Please click inside the <span className="text-cyan-400 font-semibold">cyan dashed radar box</span> on the map or select an acoustic preset.
        </p>
      </aside>
    );
  }

  const { classification, harmonic, coordinates } = data;
  if (!classification || !harmonic) return null;
  const currentNote = activeNotes[activeStep] || activeNotes[0] || {
    date: "2024-01-01",
    doy: 1,
    frequency_hz: 220,
    filter_cutoff_hz: 800,
    copol_db: -12,
    crosspol_db: -18,
    ratio_db: 6,
    gain: 0.5,
  };

  // SVG Chart Dimensions
  const chartWidth = 320;
  const chartHeight = 110;
  const minDb = -30;
  const maxDb = -5;

  const getX = (idx: number) => {
    if (activeSeries.length <= 1) return 0;
    return (idx / (activeSeries.length - 1)) * chartWidth;
  };
  const getY = (val: number) => {
    const norm = (val - minDb) / (maxDb - minDb);
    return Math.max(0, Math.min(chartHeight, chartHeight - norm * chartHeight));
  };

  const copolPoints = activeSeries.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.copol_dB).toFixed(1)}`).join(" ");
  const crosspolPoints = activeSeries.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.crosspol_dB).toFixed(1)}`).join(" ");
  const fittedPoints = activeSeries.map((pt, i) => `${getX(i).toFixed(1)},${getY(pt.fitted_dB).toFixed(1)}`).join(" ");
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
            {coordinates.lat.toFixed(3)}°N, {Math.abs(coordinates.lon).toFixed(3)}°{coordinates.lon < 0 ? "W" : "E"}
          </span>
        </div>
        <h2 className="text-lg font-bold text-white">{classification.type}</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {classification.description}
        </p>
      </div>

      {/* Mode Switcher: 1-Year Seasonal vs 10-Year Decadal */}
      <div className="px-5 pt-4 pb-1">
        <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTimelineMode("annual")}
            className={`py-1.5 rounded-lg font-semibold transition ${
              timelineMode === "annual"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1-Yr Seasonal
          </button>
          <button
            onClick={() => setTimelineMode("decadal")}
            disabled={!hasDecadal}
            className={`py-1.5 rounded-lg font-semibold transition flex items-center justify-center gap-1 ${
              timelineMode === "decadal"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            10-Yr Decadal
          </button>
        </div>
        {timelineMode === "decadal" && (
          <div className="mt-2 text-[10px] text-cyan-400 font-mono bg-cyan-950/50 border border-cyan-800/50 rounded-lg px-2.5 py-1 text-center">
            244 bi-weekly Sentinel-1 passes (2016 – 2026)
          </div>
        )}
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

          {/* Manual Speed Stepper (+ / - 0.25x) & Volume */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 bg-slate-800/90 border border-slate-700/60 p-1 rounded-xl">
              <button
                onClick={() => handleSpeedChange(Math.max(0.25, +(speed - 0.25).toFixed(2)))}
                disabled={speed <= 0.25}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Decrease speed by 0.25x"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="px-2 text-center min-w-[50px]">
                <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Speed</div>
                <div className="text-xs font-mono font-bold text-cyan-400">{speed.toFixed(2)}x</div>
              </div>
              <button
                onClick={() => handleSpeedChange(Math.min(3.0, +(speed + 0.25).toFixed(2)))}
                disabled={speed >= 3.0}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-slate-700/70 hover:bg-slate-600 text-slate-200 font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                title="Increase speed by 0.25x"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 accent-cyan-400 cursor-pointer"
                title="Volume"
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
            <div className="text-[10px] text-slate-500 uppercase">{isDecadal ? "Date" : "DOY"}</div>
            <div className="text-xs font-bold text-rose-400 truncate">
              {isDecadal ? currentNote.date : `${currentNote.date.slice(5)} (${currentNote.doy})`}
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Time-Series Chart */}
      <div className="p-5 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-300">
          <span>{isDecadal ? "10-Year Multi-Epoch Radar Timeline" : "Backscatter & Harmonic Curve"}</span>
          <span className="text-[11px] text-cyan-400 font-mono">
            Step {activeStep + 1}/{activeSeries.length} (Click chart to jump)
          </span>
        </div>

        <div
          className="relative w-full bg-slate-900/80 rounded-xl p-3 border border-slate-800 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition"
          title="Click anywhere on the chart to jump to that epoch"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left - 12;
            const usableWidth = rect.width - 24;
            const progress = Math.max(0, Math.min(1, clickX / usableWidth));
            const targetIndex = Math.round(progress * (activeSeries.length - 1));
            setActiveStep(targetIndex);
            if (sonifierRef.current) {
              sonifierRef.current.seekToStep(targetIndex);
            }
          }}
        >
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28 overflow-visible">
            {/* Grid Lines */}
            <line x1="0" y1={getY(-10)} x2={chartWidth} y2={getY(-10)} stroke="#1f2937" strokeDasharray="3 3" />
            <line x1="0" y1={getY(-20)} x2={chartWidth} y2={getY(-20)} stroke="#1f2937" strokeDasharray="3 3" />

            {/* Fitted Harmonic Curve (Cyan Glow) - only in annual mode or if present */}
            {!isDecadal && (
              <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeOpacity="0.8" points={fittedPoints} />
            )}

            {/* Copol (VV / HH) Series (Emerald) */}
            <polyline fill="none" stroke="#10b981" strokeWidth={isDecadal ? "1.2" : "1.5"} points={copolPoints} />

            {/* Crosspol (VH / HV) Series (Purple) */}
            <polyline fill="none" stroke="#a855f7" strokeWidth={isDecadal ? "1.0" : "1.2"} strokeDasharray={isDecadal ? "" : "4 2"} points={crosspolPoints} />

            {/* Active Playhead Scanning Line */}
            <line x1={activeX} y1="0" x2={activeX} y2={chartHeight} stroke="#f43f5e" strokeWidth="2" />
            <circle cx={activeX} cy={getY(currentNote.copol_db)} r="4" fill="#f43f5e" />
          </svg>

          {/* Chart Legend */}
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Copol (VV)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-purple-400 inline-block" /> Crosspol (VH)
            </span>
            {!isDecadal ? (
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-cyan-400 inline-block" /> Harmonic Fit
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">
                2016 – 2026
              </span>
            )}
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
