"use client";

import React, { useEffect, useRef, useState } from "react";
import { Region } from "@/types";
import { getHeartbeatImageUrl } from "@/lib/api";
import { Layers, MapPin, Sparkles, Sliders } from "lucide-react";

interface MapViewProps {
  region: Region;
  onPointSelected: (lat: number, lon: number) => void;
  selectedCoords: { lat: number; lon: number } | null;
}

export const MapView: React.FC<MapViewProps> = ({
  region,
  onPointSelected,
  selectedCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlayRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      // Fix default marker icon assets
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [region.center[1], region.center[0]],
          zoom: region.zoom,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Dark Basemap tile layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> & NASA',
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        // Click handler to sonify
        map.on("click", (e: any) => {
          onPointSelected(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center, bounds and Heartbeat Image Overlay on region change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      map.flyTo([region.center[1], region.center[0]], region.zoom, { duration: 1.5 });

      // Remove existing overlay
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
      }

      // Add regional Heartbeat Overlay
      // bounds: [min_lon, min_lat, max_lon, max_lat] -> [[min_lat, min_lon], [max_lat, max_lon]]
      const [min_lon, min_lat, max_lon, max_lat] = region.bounds;
      const bounds: [[number, number], [number, number]] = [
        [min_lat, min_lon],
        [max_lat, max_lon],
      ];

      const overlay = L.imageOverlay(getHeartbeatImageUrl(region.id), bounds, {
        opacity: overlayOpacity,
        interactive: false,
      }).addTo(map);

      overlayRef.current = overlay;
    });
  }, [region, mapLoaded]);

  // Update overlay opacity dynamically
  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setOpacity(overlayOpacity);
    }
  }, [overlayOpacity]);

  // Update marker position when selected coordinates change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !selectedCoords) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (markerRef.current) {
        markerRef.current.setLatLng([selectedCoords.lat, selectedCoords.lon]);
      } else {
        const pulsingIcon = L.divIcon({
          className: "custom-pulse-marker",
          html: `<div class="w-6 h-6 rounded-full bg-cyan-400/30 border-2 border-cyan-400 flex items-center justify-center animate-ping"></div><div class="w-3 h-3 rounded-full bg-cyan-400 absolute top-1.5 left-1.5 shadow-lg shadow-cyan-500"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        markerRef.current = L.marker([selectedCoords.lat, selectedCoords.lon], {
          icon: pulsingIcon,
        }).addTo(map);
      }
    });
  }, [selectedCoords, mapLoaded]);

  // Presets
  const presets = region.id === "sacramento"
    ? [
        { name: "🌾 Rice Paddy Basin", lat: 38.835, lon: -121.725 },
        { name: "💧 Sacramento River", lat: 38.805, lon: -121.685 },
        { name: "🌳 Walnut Orchard", lat: 38.740, lon: -121.780 },
        { name: "🏙️ Urban Woodland", lat: 38.695, lon: -121.770 },
      ]
    : [
        { name: "🌾 Wheat-Rice Field", lat: 30.910, lon: 75.830 },
        { name: "💧 Sutlej River", lat: 30.980, lon: 75.860 },
        { name: "🌿 Canal Irrigation", lat: 30.840, lon: 75.760 },
        { name: "🏙️ Ludhiana Cluster", lat: 30.895, lon: 75.920 },
      ];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-slate-950" />

      {/* Floating Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-auto">
        {/* Layer Opacity Controller */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex items-center space-x-3 text-xs">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-300 font-medium">Heartbeat Overlay:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
          />
          <span className="text-slate-400 w-8 text-right">
            {Math.round(overlayOpacity * 100)}%
          </span>
        </div>

        {/* Quick Jump Presets */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Acoustic Presets
          </div>
          <div className="flex flex-wrap gap-1.5 max-w-xs">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => onPointSelected(p.lat, p.lon)}
                className="px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 rounded-md border border-slate-700/60 transition"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend & Instructions Overlay */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl max-w-sm pointer-events-auto text-xs text-slate-300 space-y-2">
          <div className="flex items-center justify-between font-semibold text-white">
            <span>Harmonic Color Rhythm</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
              HSV Encoded
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              <span>Spring Peak</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
              <span>Summer Peak</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
              <span>Autumn Peak</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Click anywhere on the map to sample the backscatter time series and hear the land's acoustic song.
          </p>
        </div>
      </div>
    </div>
  );
};
