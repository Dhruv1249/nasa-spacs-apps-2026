"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Region, PointQueryResponse } from "@/types";
import { fetchRegions, queryPoint, FALLBACK_REGIONS } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { AudioInspector } from "@/components/AudioInspector";
import { PhysicsModal } from "@/components/PhysicsModal";
import { ExplorerTour } from "@/components/ExplorerTour";
import { Activity } from "lucide-react";

function ExplorerContent() {
  const searchParams = useSearchParams();
  const initialRegionParam = searchParams.get("region");

  const [regions, setRegions] = useState<Region[]>(FALLBACK_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<Region>(() => {
    if (initialRegionParam) {
      const match = FALLBACK_REGIONS.find((r) => r.id === initialRegionParam);
      if (match) return match;
    }
    return FALLBACK_REGIONS[0];
  });

  const selectedRegionRef = useRef(selectedRegion);
  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [pointData, setPointData] = useState<PointQueryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [timelineSeason, setTimelineSeason] = useState<string>("harmonic");
  const [activeTimelineDate, setActiveTimelineDate] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(false);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Check first visit for interactive tour
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenTour = localStorage.getItem("land_heartbeat_tour_seen");
      if (!hasSeenTour) {
        const timer = setTimeout(() => {
          setIsTourOpen(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Load regions from API or fallback
  useEffect(() => {
    fetchRegions().then((regs) => {
      if (regs && regs.length > 0) {
        setRegions(regs);
        if (initialRegionParam) {
          const match = regs.find((r) => r.id === initialRegionParam);
          if (match) {
            setSelectedRegion(match);
            selectedRegionRef.current = match;
            return;
          }
        }
        setSelectedRegion(regs[0]);
        selectedRegionRef.current = regs[0];
      }
    });
  }, [initialRegionParam]);

  const handleActiveEpochChange = (date: string, doy: number, seasonFrame: string) => {
    setTimelineSeason(seasonFrame);
    setActiveTimelineDate(date);
  };

  const handleSelectRegion = (r: Region) => {
    setSelectedRegion(r);
    selectedRegionRef.current = r;
    setSelectedCoords(null);
    setPointData(null);
    setIsPlaying(false);

    // Automatically sample representative coordinate
    const defaultLat = r.id === "sacramento" ? 38.835 : 30.910;
    const defaultLon = r.id === "sacramento" ? -121.725 : 75.830;
    handlePointSelected(defaultLat, defaultLon, r.id);
  };

  const handlePointSelected = async (lat: number, lon: number, regId?: string) => {
    const targetRegion = regId || selectedRegionRef.current.id;
    setSelectedCoords({ lat, lon });
    setLoading(true);
    try {
      const data = await queryPoint(targetRegion, lat, lon);
      setPointData(data);
    } catch (err) {
      console.error("Error querying point:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const defaultLat = selectedRegion.id === "sacramento" ? 38.835 : 30.910;
    const defaultLon = selectedRegion.id === "sacramento" ? -121.725 : 75.830;
    handlePointSelected(defaultLat, defaultLon, selectedRegion.id);
  }, []);

  const handleRecenter = () => {
    setRecenterTrigger((prev) => prev + 1);
    const regId = selectedRegionRef.current.id;
    const defaultLat = regId === "sacramento" ? 38.835 : 30.910;
    const defaultLon = regId === "sacramento" ? -121.725 : 75.830;
    handlePointSelected(defaultLat, defaultLon, regId);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas text-navy">
      {/* Sleek Frosted Glass Top Navigation */}
      <Navbar
        regions={regions}
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelectRegion}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {/* EOS LandViewer + Windy Layout Workstation */}
      <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Full-Canvas Map Viewport */}
        <section className="flex-1 relative h-1/2 lg:h-full">
          <MapView
            region={selectedRegion}
            onPointSelected={(lat, lon) => handlePointSelected(lat, lon)}
            selectedCoords={selectedCoords}
            timelineSeason={timelineSeason}
            activeTimelineDate={activeTimelineDate}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            speed={playbackSpeed}
            onSpeedChange={(s) => setPlaybackSpeed(s)}
            onStepDelta={(delta) => setActiveStep((prev) => Math.max(0, prev + delta))}
            recenterTrigger={recenterTrigger}
          />
        </section>

        {/* Collapsible Right Analysis Drawer */}
        <section className={`h-1/2 lg:h-full z-10 transition-all ${isInspectorCollapsed ? "w-0" : "w-full lg:w-96"}`}>
          <AudioInspector
            data={pointData}
            loading={loading}
            onActiveEpochChange={handleActiveEpochChange}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            speed={playbackSpeed}
            onSpeedChange={(s) => setPlaybackSpeed(s)}
            isCollapsed={isInspectorCollapsed}
            onToggleCollapse={() => setIsInspectorCollapsed(!isInspectorCollapsed)}
            activeStep={activeStep}
            onStepChange={setActiveStep}
            onRecenter={handleRecenter}
          />
        </section>
      </main>

      {/* SAR Physics & Sonification Explainer Modal */}
      <PhysicsModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Interactive First-Visit Feature Tour */}
      <ExplorerTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-canvas flex flex-col items-center justify-center space-y-3 text-sand-dark">
          <Activity className="w-8 h-8 text-coral animate-spin" />
          <span className="text-xs font-mono font-bold text-navy">Initializing Earth Observation Workstation...</span>
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  );
}
