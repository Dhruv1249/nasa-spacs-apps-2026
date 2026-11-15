"use client";

import React, { useEffect, useState } from "react";
import { Region, PointQueryResponse } from "@/types";
import { fetchRegions, queryPoint, FALLBACK_REGIONS } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { AudioInspector } from "@/components/AudioInspector";
import { PhysicsModal } from "@/components/PhysicsModal";

export default function Home() {
  const [regions, setRegions] = useState<Region[]>(FALLBACK_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<Region>(FALLBACK_REGIONS[0]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [pointData, setPointData] = useState<PointQueryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [timelineSeason, setTimelineSeason] = useState<string>("harmonic");
  const [activeTimelineDate, setActiveTimelineDate] = useState<string>("");

  // Load regions from API or fallback
  useEffect(() => {
    fetchRegions().then((regs) => {
      if (regs && regs.length > 0) {
        setRegions(regs);
        setSelectedRegion(regs[0]);
      }
    });
  }, []);

  const handleActiveEpochChange = (date: string, doy: number, seasonFrame: string) => {
    setTimelineSeason(seasonFrame);
    setActiveTimelineDate(date);
  };

  // When region changes, clear selection or select region center
  const handleSelectRegion = (r: Region) => {
    setSelectedRegion(r);
    setSelectedCoords(null);
    setPointData(null);
    // Automatically select a characteristic feature in the new region
    const defaultLat = r.id === "sacramento" ? 38.835 : 30.910;
    const defaultLon = r.id === "sacramento" ? -121.725 : 75.830;
    handlePointSelected(defaultLat, defaultLon, r.id);
  };

  const handlePointSelected = async (lat: number, lon: number, regId?: string) => {
    const targetRegion = regId || selectedRegion.id;
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

  // Initial load: sample default field in Sacramento
  useEffect(() => {
    handlePointSelected(38.835, -121.725, "sacramento");
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950">
      <Navbar
        regions={regions}
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelectRegion}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">
        {/* Interactive Map View */}
        <section className="flex-1 relative h-1/2 lg:h-full">
          <MapView
            region={selectedRegion}
            onPointSelected={(lat, lon) => handlePointSelected(lat, lon)}
            selectedCoords={selectedCoords}
            timelineSeason={timelineSeason}
            activeTimelineDate={activeTimelineDate}
          />
        </section>

        {/* Acoustic Sonifier & Time-Series Inspector Sidebar */}
        <section className="w-full lg:w-96 h-1/2 lg:h-full z-10 shadow-2xl">
          <AudioInspector
            data={pointData}
            loading={loading}
            onActiveEpochChange={handleActiveEpochChange}
          />
        </section>
      </main>

      {/* Physics Explainer Modal */}
      <PhysicsModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
