"use client";

import React, { useEffect, useState, useRef } from "react";
import { PointQueryResponse } from "@/types";
import { RadarSonifier } from "@/audio/Sonifier";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Radio,
  Activity,
  Layers,
  MapPin,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  Headphones
} from "lucide-react";

interface AudioInspectorProps {
  data: PointQueryResponse | null;
  loading: boolean;
  onActiveEpochChange?: (date: string, doy: number, seasonFrame: string) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeStep?: number;
  onStepChange?: (step: number | ((prev: number) => number)) => void;
}

export const AudioInspector: React.FC<AudioInspectorProps> = ({
  data,
  loading,
  onActiveEpochChange,
  isPlaying: externalIsPlaying,
  onTogglePlay: externalTogglePlay,
  speed: externalSpeed,
  onSpeedChange: externalOnSpeedChange,
  isCollapsed = false,
  onToggleCollapse,
  activeStep: externalActiveStep,
  onStepChange: externalOnStepChange,
}) => {
  const [timelineMode, setTimelineMode] = useState<"annual" | "decadal">("annual");
  const [internalIsPlaying, setInternalIsPlaying] = useState<boolean>(false);
  const [internalActiveStep, setInternalActiveStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [internalSpeed, setInternalSpeed] = useState<number>(0.5);

  const speed = externalSpeed !== undefined ? externalSpeed : internalSpeed;
  const isPlaying = externalIsPlaying !== undefined ? externalIsPlaying : internalIsPlaying;
  const activeStep = externalActiveStep !== undefined ? externalActiveStep : internalActiveStep;
  const setActiveStep = externalOnStepChange || setInternalActiveStep;

  const sonifierRef = useRef<RadarSonifier | null>(null);

  const hasDecadal = Boolean(data?.decadal_time_series && data.decadal_time_series.length > 0);
  const isDecadal = timelineMode === "decadal" && hasDecadal;

  const activeSeries = isDecadal ? data!.decadal_time_series! : (data?.time_series || []);
  const activeSonification = isDecadal ? data!.decadal_sonification : data?.sonification;
  const activeNotes = activeSonification?.note_events || [];

  useEffect(() => {
    const sonifier = new RadarSonifier();
    sonifier.setSpeed(speed);
    sonifier.setOnStepCallback((step) => {
      setActiveStep(step);
    });
    sonifierRef.current = sonifier;

    return () => {
      sonifier.stop();
    };
  }, []);

  useEffect(() => {
    if (data && !data.is_out_of_bounds && sonifierRef.current && activeNotes.length > 0) {
      sonifierRef.current.setSpeed(speed);
      sonifierRef.current.setBaseNoteDuration(isDecadal ? 0.35 : 0.65);
      sonifierRef.current.setNoteEvents(activeNotes);
      setActiveStep(0);
      if (isPlaying) {
        sonifierRef.current.play();
      }
    }
  }, [data, timelineMode]);

  useEffect(() => {
    if (!sonifierRef.current) return;
    if (isPlaying) {
      sonifierRef.current.play();
    } else {
      sonifierRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (sonifierRef.current) {
      sonifierRef.current.setSpeed(speed);
    }
  }, [speed]);

  // Synchronize map timeline with active note
  useEffect(() => {
    if (activeNotes.length > 0 && activeStep < activeNotes.length) {
      const cur = activeNotes[activeStep];
      if (onActiveEpochChange && cur) {
        let frameId = "harmonic";
        if (timelineMode === "annual") {
          // Map to 25 individual bi-weekly satellite radar photos (epoch_00 to epoch_24)
          frameId = `epoch_${String(activeStep % 25).padStart(2, "0")}`;
        } else {
          // 10-Year Decadal Mode: each of the 244 passes has its own calibrated satellite photo!
          const decadalIdx = Math.min(243, Math.max(0, activeStep));
          frameId = `decadal_${String(decadalIdx).padStart(3, "0")}`;
        }

        onActiveEpochChange(cur.date, cur.doy, frameId);
      }
    }
  }, [activeStep, activeNotes, timelineMode, onActiveEpochChange]);

  const handleTogglePlay = async () => {
    if (externalTogglePlay) {
      externalTogglePlay();
    } else {
      if (!sonifierRef.current) return;
      if (internalIsPlaying) {
        sonifierRef.current.pause();
        setInternalIsPlaying(false);
      } else {
        await sonifierRef.current.play();
        setInternalIsPlaying(true);
      }
    }
  };

  const handleReset = () => {
    if (!sonifierRef.current) return;
    sonifierRef.current.stop();
    if (externalTogglePlay && isPlaying) {
      externalTogglePlay();
    } else {
      setInternalIsPlaying(false);
    }
    setActiveStep(0);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (sonifierRef.current) sonifierRef.current.setVolume(v);
  };

  const handleSpeedChange = (newSpeed: number) => {
    if (externalOnSpeedChange) {
      externalOnSpeedChange(newSpeed);
    } else {
      setInternalSpeed(newSpeed);
      if (sonifierRef.current) sonifierRef.current.setSpeed(newSpeed);
    }
  };

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="absolute top-20 right-4 z-20 glass-panel p-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-navy hover:text-coral transition group border border-ice bg-white/95"
        title="Expand Acoustic Inspector"
      >
        <ChevronLeft className="w-4 h-4 text-coral group-hover:-translate-x-0.5 transition-transform" />
        <Headphones className="w-4 h-4 text-coral" />
        <span className="text-xs font-mono font-bold">ACOUSTIC TELEMETRY</span>
      </button>
    );
  }

  if (loading) {
    return (
      <aside className="w-full lg:w-96 glass-panel border-l border-ice p-6 flex flex-col items-center justify-center space-y-4 h-full relative font-mono bg-white/95 text-navy">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-4 left-4 p-1 rounded-lg text-sand-dark hover:text-navy transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <Activity className="w-7 h-7 text-coral animate-spin" />
        <p className="text-xs text-navy/70 text-center font-bold">
          SAMPLING SAR TIME SERIES &amp; FOURIER HARMONICS...
        </p>
      </aside>
    );
  }

  if (!data) {
    return (
      <aside className="w-full lg:w-96 glass-panel border-l border-ice p-6 flex flex-col items-center justify-center text-center space-y-4 h-full relative font-mono bg-white/95 text-navy">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-4 left-4 p-1 rounded-lg text-sand-dark hover:text-navy transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <div className="p-3 bg-coral/10 border border-coral/30 rounded-2xl text-coral">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Select Landscape Coordinate</h3>
        <p className="text-[11px] text-navy/70 max-w-xs leading-relaxed font-sans">
          Click inside the coral dashed radar footprint to query dual-polarization backscatter history and synthesize its acoustic signature.
        </p>
      </aside>
    );
  }

  if (data.is_out_of_bounds) {
    return (
      <aside className="w-full lg:w-96 glass-panel border-l border-ice p-6 flex flex-col items-center justify-center text-center space-y-4 h-full relative font-mono bg-white/95 text-navy">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute top-4 left-4 p-1 rounded-lg text-sand-dark hover:text-navy transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <div className="p-3 bg-coral/15 border border-coral/30 rounded-2xl text-coral">
          <MapPin className="w-6 h-6 animate-bounce" />
        </div>
        <h3 className="text-xs font-bold text-navy uppercase tracking-wider">Outside Footprint Bounds</h3>
        <div className="bg-canvas-subtle p-3 rounded-xl border border-ice text-left space-y-1 w-full">
          <p className="text-[11px] text-coral font-sans leading-relaxed font-bold">
            {data.message}
          </p>
          <div className="text-[9px] text-sand-dark font-mono">
            BOUNDS: [{data.bounds?.join(", ")}]
          </div>
        </div>
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

  const chartWidth = 320;
  const chartHeight = 100;
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
    <aside className="w-full lg:w-96 glass-panel border-l border-ice bg-white/95 text-navy flex flex-col h-full overflow-y-auto relative font-mono text-xs shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-ice space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1 rounded-lg text-sand-dark hover:text-navy transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <span className="text-[9px] uppercase tracking-wider text-navy font-bold bg-canvas-subtle px-2 py-0.5 rounded border border-ice">
              {classification.acoustic_archetype.replace("_", " ")}
            </span>
          </div>
          <span className="text-[10px] text-coral font-bold">
            {coordinates.lat.toFixed(3)}°N, {Math.abs(coordinates.lon).toFixed(3)}°{coordinates.lon < 0 ? "W" : "E"}
          </span>
        </div>

        <h2 className="text-sm font-bold text-navy tracking-tight font-sans">{classification.type}</h2>
        <p className="text-[11px] text-navy/70 leading-relaxed font-sans font-normal">
          {classification.description}
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="px-4 pt-3 pb-1">
        <div className="grid grid-cols-2 bg-canvas-subtle p-1 rounded-full border border-ice text-[11px]">
          <button
            onClick={() => setTimelineMode("annual")}
            className={`py-1 rounded-full transition font-bold ${
              timelineMode === "annual"
                ? "bg-coral text-white shadow-sm shadow-coral/25"
                : "text-sand-dark hover:text-navy"
            }`}
          >
            1-Yr Seasonal
          </button>
          <button
            onClick={() => setTimelineMode("decadal")}
            disabled={!hasDecadal}
            className={`py-1 rounded-full transition font-bold flex items-center justify-center gap-1 ${
              timelineMode === "decadal"
                ? "bg-coral text-white shadow-sm shadow-coral/25"
                : "text-sand-dark hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            10-Yr Decadal
          </button>
        </div>
      </div>

      {/* Audio Controls */}
      <div className="p-4 border-b border-ice bg-canvas-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTogglePlay}
              className="p-2.5 rounded-xl bg-coral hover:bg-coral-dark text-white font-bold transition shadow-md shadow-coral/20"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-white hover:bg-ice text-navy border border-ice transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-coral" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-white border border-ice p-1 rounded-xl shadow-sm">
              <button
                onClick={() => handleSpeedChange(Math.max(0.25, +(speed - 0.25).toFixed(2)))}
                disabled={speed <= 0.25}
                className="w-5 h-5 flex items-center justify-center rounded bg-canvas-subtle text-navy disabled:opacity-30 font-bold"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="px-1 text-center min-w-[38px]">
                <span className="text-[10px] font-bold text-navy">{speed.toFixed(2)}x</span>
              </div>
              <button
                onClick={() => handleSpeedChange(Math.min(3.0, +(speed + 0.25).toFixed(2)))}
                disabled={speed >= 3.0}
                className="w-5 h-5 flex items-center justify-center rounded bg-canvas-subtle text-navy disabled:opacity-30 font-bold"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-xl border border-ice shadow-sm">
              {volume > 0 ? <Volume2 className="w-3.5 h-3.5 text-coral" /> : <VolumeX className="w-3.5 h-3.5 text-sand-dark" />}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-10 accent-coral cursor-pointer h-1 bg-ice rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Telemetry Badge */}
        <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-ice text-center shadow-sm">
          <div>
            <div className="text-[9px] text-sand-dark uppercase font-bold">Frequency</div>
            <div className="text-xs font-bold text-coral">{currentNote.frequency_hz} Hz</div>
          </div>
          <div>
            <div className="text-[9px] text-sand-dark uppercase font-bold">LPF Cutoff</div>
            <div className="text-xs font-bold text-navy">{currentNote.filter_cutoff_hz} Hz</div>
          </div>
          <div>
            <div className="text-[9px] text-sand-dark uppercase font-bold">Acquisition</div>
            <div className="text-xs font-bold text-navy truncate">
              {currentNote.date ? currentNote.date.slice(5) : "EPOCH"}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="p-4 border-b border-ice space-y-2">
        <div className="flex items-center justify-between text-[11px] text-sand-dark font-bold">
          <span className="text-navy">
            {currentNote.date ? currentNote.date : "2024"}
          </span>
          <span>
            STEP {activeStep + 1}/{activeSeries.length}
          </span>
        </div>

        <div
          className="relative w-full bg-canvas-subtle rounded-xl p-3 border border-ice overflow-hidden select-none hover:border-coral transition shadow-inner"
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            preserveAspectRatio="none"
            className="w-full h-20 block cursor-crosshair overflow-visible touch-none"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const targetIndex = Math.round(progress * (activeSeries.length - 1));
              setActiveStep(targetIndex);
              if (sonifierRef.current) sonifierRef.current.seekToStep(targetIndex);
            }}
            onPointerMove={(e) => {
              if (e.buttons === 1) {
                const rect = e.currentTarget.getBoundingClientRect();
                const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const targetIndex = Math.round(progress * (activeSeries.length - 1));
                setActiveStep(targetIndex);
                if (sonifierRef.current) sonifierRef.current.seekToStep(targetIndex);
              }
            }}
          >
            <line x1="0" y1={getY(-10)} x2={chartWidth} y2={getY(-10)} stroke="#cdd7d6" strokeDasharray="2 2" />
            <line x1="0" y1={getY(-20)} x2={chartWidth} y2={getY(-20)} stroke="#cdd7d6" strokeDasharray="2 2" />

            {!isDecadal && (
              <polyline fill="none" stroke="#241e19" strokeWidth="2.0" strokeOpacity="0.85" points={fittedPoints} />
            )}
            <polyline fill="none" stroke="#102542" strokeWidth={isDecadal ? "1.0" : "1.8"} points={copolPoints} />
            <polyline fill="none" stroke="#f87060" strokeWidth={isDecadal ? "1.0" : "1.8"} points={crosspolPoints} />

            <line x1={activeX} y1="0" x2={activeX} y2={chartHeight} stroke="#f87060" strokeWidth="2.0" />
            <circle cx={activeX} cy={getY(currentNote.copol_db)} r="3.5" fill="#f87060" stroke="#ffffff" strokeWidth="1.5" />
          </svg>

          <div className="flex items-center justify-between mt-2 text-[9px] text-sand-dark border-t border-ice pt-1 font-mono font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-navy inline-block" /> VV Copol
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-coral inline-block" /> VH Crosspol
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-sand inline-block" /> Harmonic Fit
            </span>
          </div>
        </div>
      </div>

      {/* Harmonic Metrics */}
      <div className="p-4 space-y-2 border-b border-ice">
        <div className="text-[10px] text-sand-dark uppercase tracking-wider font-bold">
          PHENOLOGICAL REGRESSION METRICS
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-canvas-subtle p-2.5 rounded-lg border border-ice">
            <div className="text-sand-dark text-[9px] font-bold">Mean Power (a₀)</div>
            <div className="text-navy font-bold">{harmonic.a0.toFixed(2)} dB</div>
          </div>
          <div className="bg-canvas-subtle p-2.5 rounded-lg border border-ice">
            <div className="text-sand-dark text-[9px] font-bold">Amplitude (Amp)</div>
            <div className="text-navy font-bold">±{harmonic.amplitude.toFixed(2)} dB</div>
          </div>
          <div className="bg-canvas-subtle p-2.5 rounded-lg border border-ice">
            <div className="text-sand-dark text-[9px] font-bold">Peak Timing (Phase)</div>
            <div className="text-coral font-bold">DOY {Math.round(harmonic.phase_doy)}</div>
          </div>
          <div className="bg-canvas-subtle p-2.5 rounded-lg border border-ice">
            <div className="text-sand-dark text-[9px] font-bold">Regression (R²)</div>
            <div className="text-coral font-bold">{(harmonic.r_squared * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Literary Translation */}
      <div className="p-4 space-y-1.5 font-sans">
        <div className="text-[10px] font-mono uppercase tracking-wider text-sand-dark font-bold">
          Acoustic Interpretation
        </div>
        <p className="text-[11px] text-navy/70 leading-relaxed font-normal">
          {classification.acoustic_archetype.includes("paddy") ? (
            <>
              Submerged specular reflections during spring flooding produce a subterranean sonar hum, which climbs steadily in harmonic pitch as canopy volume expands toward autumn harvest.
            </>
          ) : (
            <>
              A dual-frequency harmonic arpeggio reflecting rapid bi-annual rotation of Kharif rice and Rabi winter wheat, capturing two phenological heartbeats within a single orbital year.
            </>
          )}
        </p>
      </div>
    </aside>
  );
};
