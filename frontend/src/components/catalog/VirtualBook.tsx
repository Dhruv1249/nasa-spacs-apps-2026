"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Satellite,
  ChevronLeft,
  ChevronRight,
  Volume2,
  ExternalLink,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  Compass,
  Radio,
  Sliders,
  Check,
  RefreshCw
} from "lucide-react";

export interface CatalogFrame {
  id: string;
  index: number;
  date: string;
  year: number;
  month: number;
  doy: number;
  season: "Spring Inundation" | "Summer Canopy Peak" | "Autumn Harvest" | "Winter Fallow";
  anomaly?: string;
  vvDb: number;
  vhDb: number;
  audioFreqHz: number;
  description: string;
}

interface VirtualBookProps {
  frames: CatalogFrame[];
  selectedYear?: string;
  onYearSelect?: (year: string) => void;
  onResetFilters?: () => void;
}

export const VirtualBook: React.FC<VirtualBookProps> = ({
  frames,
  selectedYear = "all",
  onYearSelect,
  onResetFilters,
}) => {
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  const totalSpreads = Math.ceil(frames.length / 2);

  // Sync and reset/clamp spread index whenever filtered frames change
  const prevFramesRef = useRef(frames);
  useEffect(() => {
    if (prevFramesRef.current !== frames) {
      prevFramesRef.current = frames;
      setSpreadIndex(0);
    } else {
      setSpreadIndex((prev) => {
        const maxSpread = Math.max(0, Math.ceil(frames.length / 2) - 1);
        return Math.min(prev, maxSpread);
      });
    }
  }, [frames]);

  // Active spread pages
  const currentLeft = frames[spreadIndex * 2] || null;
  const currentRight = frames[spreadIndex * 2 + 1] || null;

  // Pages for the 3D flipping leaf
  const [flippingPages, setFlippingPages] = useState<{
    front: CatalogFrame | null;
    back: CatalogFrame | null;
  }>({ front: null, back: null });

  // Web Audio page-turning swoosh sound with throttling for slider scrubbing
  const lastSoundTimeRef = useRef(0);
  const playPageTurnSound = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.03);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      setTimeout(() => ctx.close(), 160);
    } catch (e) {
      // Audio fallback
    }
  };

  const playThrottledPageTurnSound = () => {
    const now = Date.now();
    if (now - lastSoundTimeRef.current > 180) {
      lastSoundTimeRef.current = now;
      playPageTurnSound();
    }
  };

  // Turn page forward (Right page rotates -180 deg to the left)
  const handleNextPage = () => {
    if (spreadIndex >= totalSpreads - 1 || isFlipping || totalSpreads <= 1) return;

    playPageTurnSound();
    setFlippingPages({
      front: currentRight,
      back: frames[(spreadIndex + 1) * 2] || null,
    });
    setFlipDirection("next");
    setIsFlipping(true);

    setTimeout(() => {
      setSpreadIndex((prev) => prev + 1);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 680);
  };

  // Turn page backward (Left page rotates 180 deg to the right)
  const handlePrevPage = () => {
    if (spreadIndex <= 0 || isFlipping || totalSpreads <= 1) return;

    playPageTurnSound();
    setFlippingPages({
      front: currentLeft,
      back: frames[(spreadIndex - 1) * 2 + 1] || null,
    });
    setFlipDirection("prev");
    setIsFlipping(true);

    setTimeout(() => {
      setSpreadIndex((prev) => prev - 1);
      setIsFlipping(false);
      setFlipDirection(null);
    }, 680);
  };

  // Keyboard arrow listeners for realistic physical reading
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNextPage();
      if (e.key === "ArrowLeft") handlePrevPage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [spreadIndex, isFlipping, totalSpreads]);

  // Year quick jumps synchronized with filter bar
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const jumpToYear = (year: number) => {
    if (isFlipping) return;
    if (onYearSelect) {
      onYearSelect(String(year));
      playPageTurnSound();
      setSpreadIndex(0);
      return;
    }
    const targetIdx = frames.findIndex((f) => f.year === year);
    if (targetIdx !== -1) {
      playPageTurnSound();
      setSpreadIndex(Math.floor(targetIdx / 2));
    }
  };

  // Sonify pass tone
  const playPassTone = (frame: CatalogFrame) => {
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

      const normBiomass = Math.sin(((frame.doy - 60) / 365) * 2 * Math.PI) * 0.5 + 0.5;
      const filterCutoff = Math.round(350 + normBiomass * 2400);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterCutoff, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);

      osc.type = "sine";
      osc.frequency.setValueAtTime(frame.audioFreqHz, ctx.currentTime);

      overtone.type = "triangle";
      overtone.frequency.setValueAtTime(frame.audioFreqHz * 2, ctx.currentTime);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(filter);
      overtone.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      setActivePlayingId(frame.id);
      osc.start();
      overtone.start();

      osc.stop(ctx.currentTime + 1.25);
      overtone.stop(ctx.currentTime + 1.25);

      setTimeout(() => {
        setActivePlayingId(null);
        ctx.close();
      }, 1300);
    } catch (e) {
      // Audio fallback
    }
  };

  // Physical page thickness calculation
  const leftThickness = totalSpreads > 0 ? Math.max(3, Math.round((spreadIndex / totalSpreads) * 16)) : 3;
  const rightThickness = totalSpreads > 0 ? Math.max(3, Math.round(((totalSpreads - spreadIndex) / totalSpreads) * 16)) : 3;

  // Render Page Content Helper (Archival Folio with Subtle Natural Paper Curvature)
  const renderPageSheet = (frame: CatalogFrame | null, pageSide: "left" | "right") => {
    if (!frame) {
      return (
        <div className="flex-1 w-full h-full min-h-[460px] flex flex-col items-center justify-center p-8 bg-white text-navy font-mono text-xs relative select-none">
          {/* Subtle trough gradient on empty side */}
          {pageSide === "left" ? (
            <div className="absolute top-0 bottom-0 right-0 w-16 pointer-events-none z-20 bg-gradient-to-r from-transparent to-navy/[0.03]" />
          ) : (
            <div className="absolute top-0 bottom-0 left-0 w-16 pointer-events-none z-20 bg-gradient-to-r from-navy/[0.03] to-transparent" />
          )}
          <span className="text-sand font-bold text-[11px] uppercase tracking-wider">// END OF FILTERED SATELLITE PASSES //</span>
        </div>
      );
    }

    return (
      <div className="flex-1 w-full h-full flex flex-col justify-between p-6 sm:p-7 bg-white text-navy font-mono text-xs relative select-none">
        {/* Soft paper texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-[#fbfcfd] pointer-events-none" />

        {/* Subtle, soft natural paper curvature into spine (light, airy, NOT dark) */}
        {pageSide === "left" ? (
          <div className="absolute top-0 bottom-0 right-0 w-16 pointer-events-none z-20 bg-gradient-to-r from-transparent via-navy/[0.01] to-navy/[0.04]" />
        ) : (
          <div className="absolute top-0 bottom-0 left-0 w-16 pointer-events-none z-20 bg-gradient-to-r from-navy/[0.04] via-navy/[0.01] to-transparent" />
        )}

        {/* Top Header */}
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-ice text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${pageSide === "left" ? "bg-coral shadow-sm shadow-coral/40" : "bg-navy shadow-sm shadow-navy/30"}`} />
              <span className="font-bold text-navy tracking-wider">
                ORBITAL PASS #{String(frame.index + 1).padStart(3, "0")}
              </span>
            </div>
            <span className="text-sand font-bold">
              {frame.index + 1} / 244
            </span>
          </div>

          {/* Date & DOY */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-black text-navy tracking-tight">
                {frame.date}
              </span>
              <span className="text-[10px] font-bold text-coral bg-coral/10 px-2 py-0.5 rounded border border-coral/30">
                DOY {frame.doy}
              </span>
            </div>
            <div className="text-[9px] text-sand uppercase tracking-wider font-bold">
              MISSION // COPERNICUS SENTINEL-1 C-BAND SAR
            </div>
          </div>

          {/* Phenology Badge */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-canvas-subtle text-navy border border-ice">
              {frame.season}
            </span>
            {frame.anomaly && (
              <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-coral/15 text-coral-dark border border-coral/30 truncate max-w-[200px]">
                {frame.anomaly}
              </span>
            )}
          </div>

          {/* Ground Truth Observations */}
          <div className="bg-canvas-subtle p-3.5 rounded-xl border border-ice space-y-1 font-sans text-xs">
            <span className="text-[9px] font-mono uppercase text-coral font-bold block">
              Surface Phenology &amp; Scattering:
            </span>
            <p className="text-navy/80 leading-relaxed font-normal text-[11px]">
              {frame.description}
            </p>
          </div>

          {/* Radiometric dB Metrics */}
          <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-ice text-center text-xs shadow-sm">
            <div>
              <div className="text-[8px] text-sand uppercase font-bold">VV (Copol)</div>
              <div className="font-black text-navy mt-0.5">{frame.vvDb} dB</div>
            </div>
            <div>
              <div className="text-[8px] text-sand uppercase font-bold">VH (Crosspol)</div>
              <div className="font-black text-coral mt-0.5">{frame.vhDb} dB</div>
            </div>
            <div>
              <div className="text-[8px] text-sand uppercase font-bold">Pitch</div>
              <div className="font-black text-navy mt-0.5">{frame.audioFreqHz} Hz</div>
            </div>
          </div>
        </div>

        {/* Bottom Actions & Folio Number */}
        <div className="relative z-10 pt-3 border-t border-ice space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => playPassTone(frame)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-coral hover:bg-coral-dark text-white text-[11px] font-mono font-bold transition shadow-sm shadow-coral/20"
            >
              <Volume2 className={`w-3.5 h-3.5 ${activePlayingId === frame.id ? "animate-bounce" : ""}`} />
              <span>{activePlayingId === frame.id ? "PLAYING..." : "LISTEN TO PASS"}</span>
            </button>

            <Link
              href={`/explorer?epoch=${frame.id}`}
              className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full bg-navy hover:bg-navy-light text-white text-[11px] font-mono font-bold transition shadow-sm shadow-navy/20"
            >
              <span>INSPECT</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between text-[9px] text-sand font-bold">
            <span>FOLIO #{frame.index + 1}</span>
            <span>{pageSide === "left" ? "SACRAMENTO BASIN" : "INDO-GANGETIC PLAIN"}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto space-y-6">
      {/* Top Controls Bar with Cross-Validated Spread Counter & Filter Ticker */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono pb-2">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-coral" />
          <span className="text-navy font-bold uppercase tracking-wider">
            SYNTHETIC APERTURE RADAR 3D DECADAL ATLAS
          </span>
          <span className="text-[10px] text-sand font-bold">
            [ {frames.length} {frames.length === 1 ? "PASS" : "PASSES"} {selectedYear && selectedYear !== "all" ? `// YEAR ${selectedYear}` : "// 2016-2026"} ]
          </span>
        </div>

        {/* Jump Scrubber Synchronized with Filter State */}
        <div className="flex items-center space-x-3">
          <span className="text-sand text-[10px] font-bold">
            SPREAD <strong className="text-navy">{totalSpreads > 0 ? spreadIndex + 1 : 0}</strong> / <strong className="text-navy">{totalSpreads}</strong>
          </span>

          <input
            type="range"
            min="0"
            max={Math.max(0, totalSpreads - 1)}
            value={totalSpreads > 0 ? Math.min(spreadIndex, totalSpreads - 1) : 0}
            disabled={totalSpreads <= 1}
            onChange={(e) => {
              playThrottledPageTurnSound();
              setSpreadIndex(parseInt(e.target.value));
            }}
            className="w-28 sm:w-40 accent-coral cursor-pointer h-2 bg-ice rounded-lg appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
          />

          <span className="text-[10px] text-sand hidden md:inline font-bold">
            ◄ ► FLIP PAGES
          </span>
        </div>
      </div>

      {/* Year Bookmark Index Tabs (Synchronized with Filter Bar) */}
      <div className="hidden sm:flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onYearSelect ? onYearSelect("all") : jumpToYear(2016)}
          className={`px-3 py-1 rounded-t-lg font-mono text-[10px] font-bold transition-all border-t border-x ${
            selectedYear === "all"
              ? "bg-white border-coral text-coral shadow-md -translate-y-0.5"
              : "bg-canvas-subtle border-ice text-sand hover:text-navy hover:bg-white"
          }`}
        >
          ALL
        </button>
        {years.map((y) => {
          const isYearActive =
            selectedYear === String(y) ||
            (selectedYear === "all" && ((currentLeft && currentLeft.year === y) || (currentRight && currentRight.year === y)));

          return (
            <button
              key={y}
              onClick={() => jumpToYear(y)}
              className={`px-3 py-1 rounded-t-lg font-mono text-[10px] font-bold transition-all border-t border-x ${
                isYearActive
                  ? "bg-white border-coral text-coral shadow-md -translate-y-0.5"
                  : "bg-canvas-subtle border-ice text-sand hover:text-navy hover:bg-white"
              }`}
            >
              '{String(y).slice(2)}
            </button>
          );
        })}
      </div>

      {/* 3D Real Book Container with Perspective Viewport */}
      <div
        className="relative w-full mx-auto"
        style={{
          perspective: "2600px",
        }}
      >
        {/* Refined Light Aerospace Hardbound Cover */}
        <div
          className="relative w-full rounded-2xl bg-gradient-to-b from-[#eef2f6] to-[#e4eaf0] p-2 sm:p-3.5 border border-ice shadow-[0_16px_40px_-12px_rgba(16,37,66,0.08)] transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(2deg)",
          }}
        >
          {/* Stacked Paper Edges Depth on Left Side */}
          <div
            className="hidden md:block absolute left-1 top-3.5 bottom-3.5 w-2.5 rounded-l-sm bg-gradient-to-r from-ice via-canvas-subtle to-white border-l border-ice pointer-events-none"
            style={{
              boxShadow: `inset 1px 0 3px rgba(16,37,66,0.08), -${leftThickness}px 0 6px rgba(16,37,66,0.04)`,
              backgroundImage: "repeating-linear-gradient(0deg, #cdd7d6 0px, #cdd7d6 1px, #ffffff 1px, #ffffff 2px)",
            }}
          />

          {/* Stacked Paper Edges Depth on Right Side */}
          <div
            className="hidden md:block absolute right-1 top-3.5 bottom-3.5 w-2.5 rounded-r-sm bg-gradient-to-l from-ice via-canvas-subtle to-white border-r border-ice pointer-events-none"
            style={{
              boxShadow: `inset -1px 0 3px rgba(16,37,66,0.08), ${rightThickness}px 0 6px rgba(16,37,66,0.04)`,
              backgroundImage: "repeating-linear-gradient(0deg, #cdd7d6 0px, #cdd7d6 1px, #ffffff 1px, #ffffff 2px)",
            }}
          />

          {/* Book Spreads Container (Left Page + Right Page + 3D Flipping Leaf) */}
          <div
            className="relative w-full rounded-xl bg-white border border-ice flex flex-col md:flex-row items-stretch overflow-hidden shadow-sm"
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {/* Soft Ambient Gutter Shadow (Light, Subtle & Natural) */}
            <div
              className="hidden md:block absolute left-1/2 top-0 bottom-0 w-14 -translate-x-1/2 z-30 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to right, transparent 0%, rgba(16,37,66,0.01) 25%, rgba(16,37,66,0.035) 50%, rgba(16,37,66,0.01) 75%, transparent 100%)",
              }}
            />

            {/* Delicate Natural Center Crease Hairline */}
            <div
              className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 z-35 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(16,37,66,0.1) 15%, rgba(16,37,66,0.14) 50%, rgba(16,37,66,0.1) 85%, transparent 100%)",
              }}
            />

            {/* Red Silk Ribbon Bookmark (Electric Rocket Coral #f87060) */}
            <div className="hidden md:block absolute left-1/2 -top-1 w-2.5 h-24 -translate-x-1/2 z-50 pointer-events-none bg-gradient-to-b from-coral to-coral-dark shadow-sm rounded-b-sm border-x border-coral-dark" />

            {/* Empty State when filters return 0 results */}
            {frames.length === 0 ? (
              <div className="flex-1 w-full min-h-[460px] flex flex-col items-center justify-center p-8 bg-white text-navy font-mono text-center space-y-5">
                <BookOpen className="w-10 h-10 text-coral" />
                <h3 className="text-lg font-bold text-navy uppercase tracking-wider">
                  No Orbital Passes Match Active Filters
                </h3>
                <p className="text-xs text-navy/70 max-w-sm font-sans leading-relaxed">
                  Try adjusting the Year, Phenology stage, or Anomaly selector in the top filter bar to reveal satellite passes.
                </p>
                {onResetFilters && (
                  <button
                    onClick={onResetFilters}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-coral hover:bg-coral-dark text-white font-bold text-xs font-mono shadow-md shadow-coral/20 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>RESET ALL FILTERS</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* STATIC LEFT PAGE */}
                <div className="flex-1 w-full md:w-1/2 flex flex-col self-stretch border-b md:border-b-0 relative">
                  {renderPageSheet(currentLeft, "left")}

                  {/* Click left edge to flip backwards */}
                  {spreadIndex > 0 && !isFlipping && totalSpreads > 1 && (
                    <button
                      onClick={handlePrevPage}
                      className="absolute inset-y-0 left-0 w-14 group hover:bg-gradient-to-r hover:from-navy/[0.02] hover:to-transparent z-25 flex items-center justify-start pl-2 transition-all"
                      title="Click to turn page back"
                    >
                      <ChevronLeft className="w-5 h-5 text-sand group-hover:text-coral group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* STATIC RIGHT PAGE */}
                <div className="flex-1 w-full md:w-1/2 flex flex-col self-stretch relative">
                  {renderPageSheet(currentRight, "right")}

                  {/* Click right edge to flip forward */}
                  {spreadIndex < totalSpreads - 1 && !isFlipping && totalSpreads > 1 && (
                    <button
                      onClick={handleNextPage}
                      className="absolute inset-y-0 right-0 w-14 group hover:bg-gradient-to-l hover:from-navy/[0.02] hover:to-transparent z-25 flex items-center justify-end pr-2 transition-all"
                      title="Click to turn page forward"
                    >
                      <ChevronRight className="w-5 h-5 text-sand group-hover:text-coral group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* 3D DYNAMIC FLIPPING LEAF (Rotates with silky smooth easing around center trough) */}
                {isFlipping && flipDirection === "next" && (
                  <div
                    className="hidden md:block absolute top-0 bottom-0 right-0 w-1/2 z-40 pointer-events-none"
                    style={{
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                      animation: "flip-forward 680ms cubic-bezier(0.25, 1, 0.5, 1) forwards",
                    }}
                  >
                    {/* Front face of turning sheet (Pass being turned away) */}
                    <div
                      className="absolute inset-0 w-full h-full backface-hidden shadow-xl overflow-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                      }}
                    >
                      {renderPageSheet(flippingPages.front, "right")}
                      <div className="absolute inset-0 bg-gradient-to-r from-navy/[0.04] to-transparent pointer-events-none" />
                    </div>

                    {/* Back face of turning sheet (New Left Page revealed) */}
                    <div
                      className="absolute inset-0 w-full h-full shadow-xl overflow-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      {renderPageSheet(flippingPages.back, "left")}
                      <div className="absolute inset-0 bg-gradient-to-l from-navy/[0.04] to-transparent pointer-events-none" />
                    </div>
                  </div>
                )}

                {isFlipping && flipDirection === "prev" && (
                  <div
                    className="hidden md:block absolute top-0 bottom-0 left-0 w-1/2 z-40 pointer-events-none"
                    style={{
                      transformOrigin: "right center",
                      transformStyle: "preserve-3d",
                      animation: "flip-backward 680ms cubic-bezier(0.25, 1, 0.5, 1) forwards",
                    }}
                  >
                    {/* Front face of backward turning sheet */}
                    <div
                      className="absolute inset-0 w-full h-full backface-hidden shadow-xl overflow-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                      }}
                    >
                      {renderPageSheet(flippingPages.front, "left")}
                      <div className="absolute inset-0 bg-gradient-to-l from-navy/[0.04] to-transparent pointer-events-none" />
                    </div>

                    {/* Back face of backward turning sheet */}
                    <div
                      className="absolute inset-0 w-full h-full shadow-xl overflow-hidden"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(-180deg)",
                      }}
                    >
                      {renderPageSheet(flippingPages.back, "right")}
                      <div className="absolute inset-0 bg-gradient-to-r from-navy/[0.04] to-transparent pointer-events-none" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tactile Page Turn Navigation Bar */}
        <div className="pt-4 flex items-center justify-between font-mono text-xs">
          <button
            onClick={handlePrevPage}
            disabled={spreadIndex <= 0 || isFlipping || totalSpreads <= 1}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white hover:bg-canvas-subtle text-navy disabled:opacity-30 disabled:cursor-not-allowed transition border border-ice shadow-sm group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-coral" />
            <span className="font-bold">PREVIOUS SPREAD</span>
          </button>

          <div className="text-[11px] text-sand font-mono hidden sm:block font-bold">
            {frames.length > 0 ? (
              <>PAGE {spreadIndex * 2 + 1} &amp; {Math.min(frames.length, spreadIndex * 2 + 2)} // {frames.length} PASSES AVAILABLE</>
            ) : (
              <>0 PASSES MATCH CURRENT CRITERIA</>
            )}
          </div>

          <button
            onClick={handleNextPage}
            disabled={spreadIndex >= totalSpreads - 1 || isFlipping || totalSpreads <= 1}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white hover:bg-canvas-subtle text-navy disabled:opacity-30 disabled:cursor-not-allowed transition border border-ice shadow-sm group"
          >
            <span className="font-bold">NEXT SPREAD</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-coral" />
          </button>
        </div>
      </div>
    </div>
  );
};
