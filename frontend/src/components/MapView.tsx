"use client";

import React, { useEffect, useRef, useState } from "react";
import { Region } from "@/types";
import { getHeartbeatImageUrl } from "@/lib/api";
import { RadarMorphCanvas } from "@/lib/RadarMorphCanvas";
import { Layers, MapPin, Sparkles, Sliders, Globe, Eye, RotateCcw } from "lucide-react";

interface MapViewProps {
  region: Region;
  onPointSelected: (lat: number, lon: number) => void;
  selectedCoords: { lat: number; lon: number } | null;
  timelineSeason?: string;
  activeTimelineDate?: string;
}

const BASEMAPS = {
  hybrid: {
    id: "hybrid",
    name: "Google Satellite",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    options: {
      attribution: '&copy; Google Maps & NASA',
      maxZoom: 20,
    },
  },
  esriSat: {
    id: "esriSat",
    name: "ESRI Optical",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19,
    },
  },
  dark: {
    id: "dark",
    name: "Dark Canvas",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: '&copy; Esri, HERE, Garmin',
      maxZoom: 16,
    },
  },
  terrain: {
    id: "terrain",
    name: "Terrain Relief",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    options: {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
    },
  },
};

export const MapView: React.FC<MapViewProps> = ({
  region,
  onPointSelected,
  selectedCoords,
  timelineSeason,
  activeTimelineDate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const morphCanvasRef = useRef<RadarMorphCanvas | null>(null);
  const borderRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [basemapKey, setBasemapKey] = useState<keyof typeof BASEMAPS>("hybrid");
  const [radarSeason, setRadarSeason] = useState<string>("harmonic");
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const onPointSelectedRef = useRef(onPointSelected);
  useEffect(() => {
    onPointSelectedRef.current = onPointSelected;
  }, [onPointSelected]);

  // Auto-update radar season when timeline playhead advances if autoSync is active
  useEffect(() => {
    if (autoSync && timelineSeason && timelineSeason !== radarSeason) {
      setRadarSeason(timelineSeason);
    }
  }, [timelineSeason, autoSync]);

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

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [region.center[1], region.center[0]],
          zoom: region.zoom,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const currentBm = BASEMAPS[basemapKey];
        const tile = L.tileLayer(currentBm.url, currentBm.options).addTo(map);
        tileLayerRef.current = tile;

        // Click handler to sonify
        map.on("click", (e: any) => {
          if (onPointSelectedRef.current) {
            onPointSelectedRef.current(e.latlng.lat, e.latlng.lng);
          }
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      }
    });

    return () => {
      if (morphCanvasRef.current) {
        morphCanvasRef.current.destroy();
        morphCanvasRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      const selectedBm = BASEMAPS[basemapKey];
      const newTile = L.tileLayer(selectedBm.url, selectedBm.options).addTo(map);
      newTile.bringToBack();
      tileLayerRef.current = newTile;
    });
  }, [basemapKey, mapLoaded]);

  // Initialize Map layers & Footprint Border on Region change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      map.flyTo([region.center[1], region.center[0]], region.zoom, { duration: 1.5 });

      // Remove existing footprint border
      if (borderRef.current) map.removeLayer(borderRef.current);

      const [min_lon, min_lat, max_lon, max_lat] = region.bounds;
      const bounds: [[number, number], [number, number]] = [
        [min_lat, min_lon],
        [max_lat, max_lon],
      ];

      // Outline the satellite radar coverage area
      const border = L.rectangle(bounds, {
        color: "#06b6d4",
        weight: 1.8,
        dashArray: "6, 6",
        fill: false,
        interactive: false,
      }).addTo(map);
      borderRef.current = border;

      // Initialize or update GPU Radar Morph Canvas
      const frameParam = radarSeason === "harmonic" ? undefined : radarSeason;
      const initialUrl = getHeartbeatImageUrl(region.id, frameParam);

      if (!morphCanvasRef.current) {
        morphCanvasRef.current = new RadarMorphCanvas(map, L, {
          bounds,
          opacity: overlayOpacity,
          durationMs: 420,
        });
        morphCanvasRef.current.transitionToUrl(initialUrl, 0);
      } else {
        morphCanvasRef.current.setBounds(bounds);
        morphCanvasRef.current.transitionToUrl(initialUrl, 0);
      }
    });
  }, [region, mapLoaded]);

  // Dynamic GPU Pixel Morph Transition between satellite radar photos
  useEffect(() => {
    if (!morphCanvasRef.current) return;

    const frameParam = radarSeason === "harmonic" ? undefined : radarSeason;
    const nextUrl = getHeartbeatImageUrl(region.id, frameParam);
    morphCanvasRef.current.transitionToUrl(nextUrl, 420);
  }, [radarSeason, region.id]);

  // Update overlay opacity dynamically
  useEffect(() => {
    if (morphCanvasRef.current) {
      morphCanvasRef.current.setOpacity(overlayOpacity);
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
        {/* Basemap Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 shadow-xl flex items-center space-x-1">
          {(Object.keys(BASEMAPS) as (keyof typeof BASEMAPS)[]).map((key) => (
            <button
              key={key}
              onClick={() => setBasemapKey(key)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                basemapKey === key
                  ? "bg-cyan-500 text-slate-950 font-bold shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {BASEMAPS[key].name}
            </button>
          ))}
        </div>

        {/* Dynamic Heartbeat Season & Decadal Anomaly Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 shadow-xl space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Dynamic Heartbeat
              <span className="text-[9px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80 shadow-sm">
                🌊 Morph
              </span>
            </span>
            <div className="flex items-center gap-1.5">
              {activeTimelineDate && (
                <span className="text-[11px] text-rose-400 font-mono font-bold bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded shadow">
                  🗓️ {activeTimelineDate.slice(0, 4)} · {activeTimelineDate}
                </span>
              )}
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`text-[10px] px-1.5 py-0.5 rounded border transition flex items-center gap-1 ${
                  autoSync
                    ? "bg-cyan-950/90 text-cyan-400 border-cyan-800 shadow"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                }`}
                title="Automatically updates map layer with audio playhead"
              >
                Auto-Sync {autoSync ? "ON" : "OFF"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: "harmonic", label: "Harmonic" },
              { id: "epoch_08", label: "🌱 Spring Flood" },
              { id: "epoch_14", label: "🌿 Summer Peak" },
              { id: "epoch_19", label: "🌾 Autumn Harvest" },
              { id: "climate_2017_flood", label: "🌊 '17 Flood" },
              { id: "climate_2021_drought", label: "☀️ '21 Drought" },
              { id: "climate_2023_snow", label: "❄️ '23 Snow" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setRadarSeason(s.id);
                  setAutoSync(false);
                }}
                className={`px-2 py-1 text-[11px] font-medium rounded transition ${
                  radarSeason === s.id
                    ? "bg-cyan-500 text-slate-950 font-bold shadow"
                    : "bg-slate-800/70 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

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
            <span>{radarSeason === "harmonic" ? "Harmonic Color Rhythm" : "Dual-Pol SAR Composite"}</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
              {radarSeason === "harmonic" ? "HSV Encoded" : "ESA / NASA RGB"}
            </span>
          </div>
          {radarSeason === "harmonic" ? (
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
          ) : (
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Red: VV (Roughness)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Green: VH (Canopy)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <span>Blue: Ratio (Water)</span>
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-400 italic">
            Click inside the <span className="text-cyan-400 font-semibold">cyan dashed box</span> to hear the sound of the land.
          </p>
        </div>
      </div>
    </div>
  );
};
