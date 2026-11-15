"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SpotlightCard } from "@/components/animations/SpotlightCard";
import { VirtualBook, CatalogFrame } from "@/components/catalog/VirtualBook";
import {
  Satellite,
  Calendar,
  Filter,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  LayoutGrid
} from "lucide-react";

// Generate the 244 bi-weekly decadal frames (2016-11-15 to 2026-11-15)
function generateDecadalFrames(): CatalogFrame[] {
  const frames: CatalogFrame[] = [];
  const startDate = new Date(2016, 10, 15);

  for (let i = 0; i < 244; i++) {
    const d = new Date(startDate.getTime() + i * 15 * 24 * 60 * 60 * 1000);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const startOfYear = new Date(year, 0, 1);
    const doy = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const dateStr = d.toISOString().slice(0, 10);

    let season: CatalogFrame["season"] = "Winter Fallow";
    if (doy >= 80 && doy < 150) season = "Spring Inundation";
    else if (doy >= 150 && doy < 260) season = "Summer Canopy Peak";
    else if (doy >= 260 && doy < 330) season = "Autumn Harvest";

    let anomaly: string | undefined;
    if (year === 2017 && doy >= 30 && doy <= 90) anomaly = "2017 Atmospheric River Inundation";
    else if (year === 2021 && doy >= 160 && doy <= 260) anomaly = "2021 Severe California Drought";
    else if (year === 2023 && doy >= 80 && doy <= 170) anomaly = "2023 Sierra Snowmelt Inflow";

    const normBiomass = Math.sin(((doy - 60) / 365) * 2 * Math.PI) * 0.5 + 0.5;
    const vv = -20 + normBiomass * 10;
    const vh = -26 + normBiomass * 12;
    const freq = Math.round(140 + Math.pow(normBiomass, 1.4) * 480);

    frames.push({
      id: `frame_${String(i).padStart(3, "0")}`,
      index: i,
      date: dateStr,
      year,
      month,
      doy,
      season,
      anomaly,
      vvDb: +(vv).toFixed(1),
      vhDb: +(vh).toFixed(1),
      audioFreqHz: freq,
      description: `${season} observation captured at Day-of-Year ${doy}. Radar shows calibrated backscatter of ${vv.toFixed(1)} dB (VV) and ${vh.toFixed(1)} dB (VH).`
    });
  }

  return frames;
}

export default function CatalogPage() {
  const allFrames = useMemo(() => generateDecadalFrames(), []);

  const [viewMode, setViewMode] = useState<"book" | "grid">("book");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [selectedAnomaly, setSelectedAnomaly] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const filteredFrames = useMemo(() => {
    return allFrames.filter((f) => {
      if (selectedYear !== "all" && f.year !== parseInt(selectedYear)) return false;
      if (selectedSeason !== "all" && f.season !== selectedSeason) return false;
      if (selectedAnomaly !== "all" && f.anomaly !== selectedAnomaly) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          f.date.includes(q) ||
          f.season.toLowerCase().includes(q) ||
          (f.anomaly && f.anomaly.toLowerCase().includes(q)) ||
          `doy ${f.doy}`.includes(q)
        );
      }
      return true;
    });
  }, [allFrames, selectedYear, selectedSeason, selectedAnomaly, searchQuery]);

  const totalPages = Math.ceil(filteredFrames.length / itemsPerPage) || 1;
  const paginatedFrames = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFrames.slice(start, start + itemsPerPage);
  }, [filteredFrames, currentPage, itemsPerPage]);

  const years = Array.from(new Set(allFrames.map((f) => f.year))).sort();

  return (
    <div className="min-h-screen bg-canvas bg-grid-pattern text-navy flex flex-col selection:bg-coral/20 selection:text-navy">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Page Header */}
        <ScrollReveal direction="down">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-ice pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-sand text-xs font-mono uppercase tracking-wider font-bold">
                <Satellite className="w-4 h-4 text-coral" />
                <span>COPERNICUS SENTINEL-1 // 10-YEAR SATELLITE ATLAS</span>
              </div>
              <h1 className="text-3xl font-extrabold text-navy tracking-tight sm:text-4xl font-mono">
                Decadal Mission Atlas &amp; Revisit Logbook
              </h1>
              <p className="text-navy/70 text-xs sm:text-sm max-w-2xl leading-relaxed font-normal">
                An interactive displayable technical logbook documenting 244 bi-weekly satellite radar revisit passes (2016–2026).
                Flip pages, listen to each pass, and examine calibrated microwave scattering telemetry.
              </p>
            </div>

            {/* View Mode Toggle: Virtual Book vs Index Matrix */}
            <div className="flex items-center bg-white p-1 rounded-full border border-ice text-xs font-mono shrink-0 shadow-sm">
              <button
                onClick={() => setViewMode("book")}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-full font-bold transition-all ${
                  viewMode === "book"
                    ? "bg-coral text-white shadow-sm shadow-coral/25"
                    : "text-sand hover:text-navy"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>LOGBOOK VIEW</span>
              </button>

              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-full font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-coral text-white shadow-sm shadow-coral/25"
                    : "text-sand hover:text-navy"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>INDEX GRID</span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* Filter & Search Bar */}
        <ScrollReveal direction="up" delayMs={50}>
          <div className="bg-white p-4 sm:p-5 rounded-2xl space-y-3 font-mono border border-ice shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-sand" />
                <input
                  type="text"
                  placeholder="FILTER DATE (YYYY-MM-DD) OR DOY..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-canvas-subtle border border-ice rounded-xl pl-9 pr-3 py-2 text-xs text-navy placeholder-sand-dark focus:outline-none focus:border-coral uppercase font-bold"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <div className="flex items-center space-x-1.5 bg-canvas-subtle border border-ice px-3 py-1.5 rounded-xl text-xs">
                  <Calendar className="w-3.5 h-3.5 text-coral" />
                  <span className="text-sand font-bold">YEAR:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-navy font-bold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">ALL YEARS (2016-2026)</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-canvas-subtle border border-ice px-3 py-1.5 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-coral" />
                  <span className="text-sand font-bold">PHENOLOGY:</span>
                  <select
                    value={selectedSeason}
                    onChange={(e) => {
                      setSelectedSeason(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-navy font-bold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">ALL PHENOLOGICAL STAGES</option>
                    <option value="Spring Inundation">SPRING INUNDATION</option>
                    <option value="Summer Canopy Peak">SUMMER CANOPY PEAK</option>
                    <option value="Autumn Harvest">AUTUMN HARVEST</option>
                    <option value="Winter Fallow">WINTER FALLOW</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-canvas-subtle border border-ice px-3 py-1.5 rounded-xl text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-coral" />
                  <span className="text-sand font-bold">ANOMALY:</span>
                  <select
                    value={selectedAnomaly}
                    onChange={(e) => {
                      setSelectedAnomaly(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-navy font-bold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">ALL SATELLITE PASSES</option>
                    <option value="2017 Atmospheric River Inundation">2017 ATMOSPHERIC RIVER</option>
                    <option value="2021 Severe California Drought">2021 SEVERE DROUGHT</option>
                    <option value="2023 Sierra Snowmelt Inflow">2023 SNOWPACK RUNOFF</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="text-xs text-sand flex items-center justify-between pt-2 border-t border-ice">
              <span>
                FILTERED // <strong className="text-navy font-bold">{filteredFrames.length}</strong> PASSES AVAILABLE
              </span>
              {(selectedYear !== "all" || selectedSeason !== "all" || selectedAnomaly !== "all" || searchQuery !== "") && (
                <button
                  onClick={() => {
                    setSelectedYear("all");
                    setSelectedSeason("all");
                    setSelectedAnomaly("all");
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="text-coral hover:text-coral-dark text-xs font-bold underline"
                >
                  RESET FILTERS
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* View Mode 1: 3D Virtual Mission Atlas Book */}
        {viewMode === "book" ? (
          <ScrollReveal direction="up" delayMs={100}>
            <VirtualBook
              frames={filteredFrames}
              selectedYear={selectedYear}
              onYearSelect={(y) => {
                setSelectedYear(y);
                setCurrentPage(1);
              }}
              onResetFilters={() => {
                setSelectedYear("all");
                setSelectedSeason("all");
                setSelectedAnomaly("all");
                setSearchQuery("");
                setCurrentPage(1);
              }}
            />
          </ScrollReveal>
        ) : (
          /* View Mode 2: Expanded Index Grid */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedFrames.map((frame, idx) => {
                const isSpring = frame.season === "Spring Inundation";
                const isSummer = frame.season === "Summer Canopy Peak";
                const isAutumn = frame.season === "Autumn Harvest";

                return (
                  <ScrollReveal key={frame.id} direction="up" delayMs={Math.min(idx * 30, 200)}>
                    <SpotlightCard className="p-5 space-y-4 flex flex-col justify-between h-full font-mono bg-white border border-ice shadow-sm">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-navy bg-canvas-subtle px-2.5 py-1 rounded-md border border-ice">
                            {frame.date}
                          </span>
                          <span className="text-[10px] text-sand font-bold">
                            PASS #{frame.index + 1} · DOY {frame.doy}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isSpring
                                ? "bg-coral/10 text-coral border-coral/30"
                                : isSummer
                                ? "bg-navy/10 text-navy border-navy/20"
                                : isAutumn
                                ? "bg-sand/20 text-sand border-sand/40"
                                : "bg-canvas-subtle text-sand border-ice"
                            }`}
                          >
                            {frame.season}
                          </span>
                          {frame.anomaly && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-coral/15 text-coral-dark border border-coral/30 truncate">
                              {frame.anomaly}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-navy/70 leading-relaxed font-sans font-normal">
                          {frame.description}
                        </p>

                        <div className="grid grid-cols-3 gap-2 bg-canvas-subtle p-2.5 rounded-xl border border-ice text-center text-xs">
                          <div>
                            <div className="text-[9px] text-sand uppercase font-bold">VV</div>
                            <div className="font-black text-navy">{frame.vvDb} dB</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-sand uppercase font-bold">VH</div>
                            <div className="font-black text-coral">{frame.vhDb} dB</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-sand uppercase font-bold">PITCH</div>
                            <div className="font-black text-navy">{frame.audioFreqHz} Hz</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-ice">
                        <Link
                          href={`/explorer?epoch=${frame.id}`}
                          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-full bg-canvas-subtle hover:bg-coral hover:text-white text-navy text-xs font-bold border border-ice hover:border-coral transition-all shadow-sm"
                        >
                          <span>OPEN IN WORKSTATION</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Link>
                      </div>
                    </SpotlightCard>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* Pagination Controls for Grid */}
            {totalPages > 1 && (
              <div className="bg-white p-4 rounded-2xl flex items-center justify-between font-mono text-xs border border-ice shadow-sm">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-canvas-subtle border border-ice text-navy hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition font-bold"
                >
                  <ChevronLeft className="w-4 h-4 text-coral" />
                  <span>PREVIOUS PAGE</span>
                </button>

                <span className="text-sand text-[11px] font-bold">
                  PAGE <strong className="text-navy">{currentPage}</strong> OF <strong className="text-navy">{totalPages}</strong>
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-canvas-subtle border border-ice text-navy hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition font-bold"
                >
                  <span className="font-bold">NEXT PAGE</span>
                  <ChevronRight className="w-4 h-4 text-coral" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
