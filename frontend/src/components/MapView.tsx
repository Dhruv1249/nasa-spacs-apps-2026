"use client";

import React, { useEffect, useRef, useState } from "react";
import { Region } from "@/types";
import { getHeartbeatImageUrl } from "@/lib/api";
import { RadarMorphCanvas } from "@/lib/RadarMorphCanvas";
import {
  Layers,
  MapPin,
  Sparkles,
  Sliders,
  RotateCcw,
  Satellite,
  Radio,
  Waves,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Info,
  Clock,
  Check
} from "lucide-react";

interface MapViewProps {
  region: Region;
  onPointSelected: (lat: number, lon: number) => void;
  selectedCoords: { lat: number; lon: number } | null;
  timelineSeason?: string;
  activeTimelineDate?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  speed?: number;
  onSpeedChange?: (newSpeed: number) => void;
  onStepDelta?: (delta: number) => void;
  recenterTrigger?: number;
}

const BASEMAPS = {
  hybrid: {
    id: "hybrid",
    name: "Google Satellite",
    description: "High-resolution optical satellite & road labels",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    options: {
      attribution: "&copy; Google Maps & NASA",
      maxZoom: 20,
    },
  },
  esriSat: {
    id: "esriSat",
    name: "ESRI Optical",
    description: "World imagery with natural true-color terrain",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: "&copy; Esri, Maxar, Earthstar Geographics",
      maxZoom: 19,
    },
  },
  dark: {
    id: "dark",
    name: "Cartographic Slate",
    description: "Clean muted base for maximum radar contrast",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution: "&copy; Esri, HERE, Garmin",
      maxZoom: 16,
    },
  },
  terrain: {
    id: "terrain",
    name: "Terrain Relief",
    description: "Shaded elevation contour relief",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    options: {
      attribution: "&copy; Google Maps",
      maxZoom: 20,
    },
  },
};

const RADAR_EPOCHS = [
  { id: "harmonic", label: "Harmonic Composite", category: "Synthetic Phenology", desc: "Phase-to-Hue HSV encoding" },
  { id: "epoch_08", label: "Spring Inundation (DOY 120)", category: "Seasonal Cycle", desc: "Specular water reflection minimum" },
  { id: "epoch_14", label: "Peak Canopy Biomass (DOY 210)", category: "Seasonal Cycle", desc: "Maximum volumetric VH scattering" },
  { id: "epoch_19", label: "Harvest Stubble (DOY 280)", category: "Seasonal Cycle", desc: "Rapid biomass drop & stubble scattering" },
  { id: "climate_2017_flood", label: "2017 Atmospheric River Inundation", category: "Climate Anomaly", desc: "Historic California flood inundation" },
  { id: "climate_2021_drought", label: "2021 Severe California Drought", category: "Climate Anomaly", desc: "Suppressed amplitude & fallowed acreage" },
  { id: "climate_2023_snow", label: "2023 Sierra Snowpack Runoff", category: "Climate Anomaly", desc: "Unprecedented snowmelt runoff surge" },
];

export const MapView: React.FC<MapViewProps> = ({
  region,
  onPointSelected,
  selectedCoords,
  timelineSeason,
  activeTimelineDate,
  isPlaying = false,
  onTogglePlay,
  speed = 0.5,
  onSpeedChange,
  onStepDelta,
  recenterTrigger,
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

  // Active Tool Panel Popover on Left Dock
  const [activePanel, setActivePanel] = useState<"layers" | "basemap" | "opacity" | "presets" | "legend" | null>(null);

  const onPointSelectedRef = useRef(onPointSelected);
  useEffect(() => {
    onPointSelectedRef.current = onPointSelected;
  }, [onPointSelected]);

  useEffect(() => {
    if (autoSync && timelineSeason && timelineSeason !== radarSeason) {
      setRadarSeason(timelineSeason);
    }
  }, [timelineSeason, autoSync]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    import("leaflet").then((L) => {
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

        const currentBm = BASEMAPS[basemapKey];
        const tile = L.tileLayer(currentBm.url, currentBm.options).addTo(map);
        tileLayerRef.current = tile;

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

  // Footprint border and radar canvas on region change
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      map.flyTo([region.center[1], region.center[0]], region.zoom, { duration: 1.5 });

      if (borderRef.current) map.removeLayer(borderRef.current);

      const [min_lon, min_lat, max_lon, max_lat] = region.bounds;
      const bounds: [[number, number], [number, number]] = [
        [min_lat, min_lon],
        [max_lat, max_lon],
      ];

      const border = L.rectangle(bounds, {
        color: "#06b6d4",
        weight: 1.8,
        dashArray: "4, 6",
        fill: false,
        interactive: false,
      }).addTo(map);
      borderRef.current = border;

      const frameParam = radarSeason === "harmonic" ? undefined : radarSeason;
      const initialUrl = getHeartbeatImageUrl(region.id, frameParam);

      if (!morphCanvasRef.current) {
        morphCanvasRef.current = new RadarMorphCanvas(map, L, {
          bounds,
          opacity: overlayOpacity,
          durationMs: 320,
        });
        morphCanvasRef.current.transitionToUrl(initialUrl, 0);
      } else {
        morphCanvasRef.current.setBounds(bounds);
        morphCanvasRef.current.transitionToUrl(initialUrl, 0);
      }
    });
  }, [region, mapLoaded]);

  useEffect(() => {
    if (!morphCanvasRef.current) return;
    const frameParam = radarSeason === "harmonic" ? undefined : radarSeason;
    const nextUrl = getHeartbeatImageUrl(region.id, frameParam);
    morphCanvasRef.current.transitionToUrl(nextUrl, 320);
  }, [radarSeason, region.id]);

  useEffect(() => {
    if (morphCanvasRef.current) {
      morphCanvasRef.current.setOpacity(overlayOpacity);
    }
  }, [overlayOpacity]);

  useEffect(() => {
    if (!recenterTrigger || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([region.center[1], region.center[0]], region.zoom, { duration: 1.2 });
  }, [recenterTrigger, region]);

  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !selectedCoords) return;

    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      if (markerRef.current) {
        markerRef.current.setLatLng([selectedCoords.lat, selectedCoords.lon]);
      } else {
        const pulsingIcon = L.divIcon({
          className: "custom-pulse-marker",
          html: `
            <div class="w-6 h-6 rounded-full bg-coral/30 border border-coral flex items-center justify-center animate-ping"></div>
            <div class="w-3 h-3 rounded-full bg-navy absolute top-[6px] left-[6px] shadow-md border-2 border-white"></div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        markerRef.current = L.marker([selectedCoords.lat, selectedCoords.lon], {
          icon: pulsingIcon,
        }).addTo(map);
      }
    });
  }, [selectedCoords, mapLoaded]);

  // Technical Presets without emojis
  const presets = region.id === "sacramento"
    ? [
        { name: "Sacramento Rice Basin", category: "Single-Season Inundation", lat: 38.835, lon: -121.725 },
        { name: "Sacramento Riverway", category: "Hydrological Specular Corridor", lat: 38.805, lon: -121.685 },
        { name: "Woodland Orchard Basin", category: "Permanent Woody Canopy", lat: 38.740, lon: -121.780 },
        { name: "Urban Infrastructure", category: "Double-Bounce Corner Matrix", lat: 38.695, lon: -121.770 },
      ]
    : [
        { name: "Punjab Double-Crop Parcel", category: "Intensive Kharif-Rabi Rotation", lat: 30.910, lon: 75.830 },
        { name: "Sutlej River Corridor", category: "Perennial Hydrological System", lat: 30.980, lon: 75.860 },
        { name: "Sirhind Feeder Canal", category: "Monsoon Irrigation Conduit", lat: 30.840, lon: 75.760 },
        { name: "Ludhiana Industrial Cluster", category: "Urban Settlement Complex", lat: 30.895, lon: 75.920 },
      ];

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([region.center[1], region.center[0]], region.zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-canvas">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-canvas" />

      {/* Aerospace Docked Tool Palette (Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-auto">
        <div className="glass-panel rounded-xl p-1 shadow-lg flex flex-col space-y-1 bg-white/95 border border-ice text-navy">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sand-dark hover:text-navy hover:bg-canvas-subtle transition"
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="h-px bg-ice mx-1" />
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sand-dark hover:text-navy hover:bg-canvas-subtle transition"
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="glass-panel rounded-xl p-1 shadow-lg flex flex-col space-y-1 bg-white/95 border border-ice text-navy">
          <button
            onClick={() => setActivePanel(activePanel === "layers" ? null : "layers")}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
              activePanel === "layers"
                ? "bg-coral text-white font-bold shadow-sm shadow-coral/30"
                : "text-sand-dark hover:text-navy hover:bg-canvas-subtle"
            }`}
            title="Satellite Radar Layers &amp; Phenology"
          >
            <Satellite className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "basemap" ? null : "basemap")}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
              activePanel === "basemap"
                ? "bg-coral text-white font-bold shadow-sm shadow-coral/30"
                : "text-sand-dark hover:text-navy hover:bg-canvas-subtle"
            }`}
            title="Basemaps (Optical, Terrain, Slate)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "opacity" ? null : "opacity")}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
              activePanel === "opacity"
                ? "bg-coral text-white font-bold shadow-sm shadow-coral/30"
                : "text-sand-dark hover:text-navy hover:bg-canvas-subtle"
            }`}
            title="Radar Overlay Transparency"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "presets" ? null : "presets")}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
              activePanel === "presets"
                ? "bg-coral text-white font-bold shadow-sm shadow-coral/30"
                : "text-sand-dark hover:text-navy hover:bg-canvas-subtle"
            }`}
            title="Cal/Val Geographic Presets"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActivePanel(activePanel === "legend" ? null : "legend")}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
              activePanel === "legend"
                ? "bg-coral text-white font-bold shadow-sm shadow-coral/30"
                : "text-sand-dark hover:text-navy hover:bg-canvas-subtle"
            }`}
            title="Color Legend &amp; Scattering Physics"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <div className="h-px bg-ice mx-1" />

          <button
            onClick={handleResetView}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sand-dark hover:text-navy hover:bg-canvas-subtle transition"
            title="Recenter Map on Footprint"
          >
            <RotateCcw className="w-3.5 h-3.5 text-coral" />
          </button>
        </div>
      </div>

      {/* Flyout Panel */}
      {activePanel && (
        <div className="absolute top-4 left-16 z-20 w-84 glass-panel rounded-2xl p-4 shadow-2xl space-y-3 pointer-events-auto border border-ice bg-white text-navy animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-ice">
            <span className="text-[11px] font-mono font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
              {activePanel === "layers" && <>RADAR LAYERS // COMPOSITES</>}
              {activePanel === "basemap" && <>GEOGRAPHIC UNDERLAYS</>}
              {activePanel === "opacity" && <>OVERLAY TRANSPARENCY</>}
              {activePanel === "presets" && <>CAL/VAL REFERENCE PRESETS</>}
              {activePanel === "legend" && <>POLARIMETRIC SCATTERING LEGEND</>}
            </span>
            <button
              onClick={() => setActivePanel(null)}
              className="text-sand-dark hover:text-navy text-[11px] font-mono px-1.5 py-0.5 rounded hover:bg-canvas-subtle"
            >
              ESC
            </button>
          </div>

          {activePanel === "layers" && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <div className="flex items-center justify-between text-[11px] text-sand-dark pb-1 font-mono">
                <span>EPOCH SELECTION:</span>
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`text-[9px] px-2 py-0.5 rounded border transition font-mono font-bold ${
                    autoSync
                      ? "bg-coral text-white border-coral"
                      : "bg-canvas-subtle text-sand-dark border-ice"
                  }`}
                >
                  AUTOSYNC: {autoSync ? "ON" : "OFF"}
                </button>
              </div>

              <div className="space-y-1.5">
                {RADAR_EPOCHS.map((ep) => {
                  const isSelected = radarSeason === ep.id;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setRadarSeason(ep.id);
                        setAutoSync(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                        isSelected
                          ? "bg-coral/10 border-coral text-coral font-bold"
                          : "bg-canvas-subtle hover:bg-ice text-navy border-ice"
                      }`}
                    >
                      <div>
                        <div className="font-bold font-mono text-[11px]">{ep.label}</div>
                        <div className="text-[10px] text-sand-dark mt-0.5 font-normal">{ep.desc}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-coral shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activePanel === "basemap" && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-sand-dark font-bold">Geographic Base Layer:</div>
              {(Object.keys(BASEMAPS) as (keyof typeof BASEMAPS)[]).map((key) => {
                const isSelected = basemapKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setBasemapKey(key)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition border flex items-center justify-between ${
                      isSelected
                        ? "bg-coral/10 border-coral text-coral font-bold"
                        : "bg-canvas-subtle hover:bg-ice text-navy border-ice"
                    }`}
                  >
                    <div>
                      <div className="font-bold font-mono text-[11px]">{BASEMAPS[key].name}</div>
                      <div className="text-[10px] text-sand-dark font-normal">{BASEMAPS[key].description}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-coral shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}

          {activePanel === "opacity" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between text-xs text-navy font-mono font-bold">
                <span>Overlay Blending:</span>
                <span className="text-coral">{Math.round(overlayOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="w-full accent-coral cursor-pointer h-1.5 bg-ice rounded-lg appearance-none"
              />
              <p className="text-[11px] text-sand-dark leading-relaxed font-normal">
                Calibrates balance between microwave backscatter overlays and underlying optical terrain features.
              </p>
            </div>
          )}

          {activePanel === "presets" && (
            <div className="space-y-2">
              <div className="text-[10px] font-mono uppercase text-sand-dark font-bold">Representative Coordinates:</div>
              <div className="space-y-1.5">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      onPointSelected(p.lat, p.lon);
                      setActivePanel(null);
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs bg-canvas-subtle hover:bg-ice border border-ice text-navy transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold font-mono text-[11px]">{p.name}</div>
                      <div className="text-[10px] text-sand-dark font-normal">{p.category}</div>
                    </div>
                    <span className="text-[9px] font-mono text-sand-dark bg-white px-1.5 py-0.5 rounded border border-ice font-bold">
                      {p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePanel === "legend" && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-canvas-subtle border border-ice space-y-2 font-mono">
                <div className="font-bold text-navy text-[11px] flex items-center justify-between">
                  <span>{radarSeason === "harmonic" ? "HARMONIC HSV ENCODING" : "DUAL-POL RGB COMPOSITE"}</span>
                  <span className="text-[9px] text-coral bg-white px-1.5 py-0.5 rounded border border-ice font-bold">
                    {radarSeason === "harmonic" ? "FOURIER" : "LEVEL-1 GRD"}
                  </span>
                </div>
                {radarSeason === "harmonic" ? (
                  <div className="space-y-1.5 text-[10px] text-navy/80">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                      <span className="font-medium">Phase = 0.25 (Spring Inundation / Emergence)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
                      <span className="font-medium">Phase = 0.55 (Summer Canopy Peak)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shadow-sm" />
                      <span className="font-medium">Phase = 0.85 (Autumn Harvest/Fallow)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-[10px] text-navy/80">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
                      <span className="font-medium">Red Channel: VV (Surface Roughness)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                      <span className="font-medium">Green Channel: VH (Canopy Volume)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block shadow-sm" />
                      <span className="font-medium">Blue Channel: Cross-Pol Ratio</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Coordinate Telemetry Pill (Top Right) */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto hidden sm:flex items-center space-x-2 glass-panel rounded-xl px-3 py-1.5 shadow-md text-xs font-mono border border-ice bg-white/95 text-navy">
        <Radio className="w-3.5 h-3.5 text-coral animate-pulse" />
        <span className="text-sand-dark font-bold">SENSOR:</span>
        <span className="text-navy font-bold">SENTINEL-1 C-BAND // NISAR L-BAND</span>
        {selectedCoords && (
          <>
            <div className="h-3.5 w-px bg-ice mx-1" />
            <span className="text-coral font-bold">
              {selectedCoords.lat.toFixed(3)}°N, {Math.abs(selectedCoords.lon).toFixed(3)}°{selectedCoords.lon < 0 ? "W" : "E"}
            </span>
          </>
        )}
      </div>

      {/* Bottom Floating Time Player */}
      <div className="absolute bottom-4 left-4 right-4 lg:left-14 lg:right-96 z-20 pointer-events-auto">
        <div className="glass-panel rounded-2xl p-3 shadow-2xl border border-ice bg-white/95 text-navy flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
          <div className="flex items-center space-x-2">
            {onTogglePlay && (
              <button
                onClick={onTogglePlay}
                className="p-2.5 rounded-xl bg-coral text-white font-bold transition hover:bg-coral-dark shadow-md shadow-coral/25"
                title={isPlaying ? "Pause Acoustic Playback" : "Play Acoustic Playback"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
            )}

            {onStepDelta && (
              <>
                <button
                  onClick={() => onStepDelta(-1)}
                  className="p-2 rounded-lg text-sand-dark hover:text-navy hover:bg-canvas-subtle transition"
                  title="Previous satellite revisit pass"
                >
                  <ChevronLeft className="w-4 h-4 text-coral" />
                </button>
                <button
                  onClick={() => onStepDelta(1)}
                  className="p-2 rounded-lg text-sand-dark hover:text-navy hover:bg-canvas-subtle transition"
                  title="Next satellite revisit pass"
                >
                  <ChevronRight className="w-4 h-4 text-coral" />
                </button>
              </>
            )}

            {onSpeedChange && (
              <div className="flex items-center space-x-1 bg-canvas-subtle border border-ice p-1 rounded-xl">
                <button
                  onClick={() => onSpeedChange(Math.max(0.25, +(speed - 0.25).toFixed(2)))}
                  disabled={speed <= 0.25}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-ice text-navy transition disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="px-1.5 text-center min-w-[45px]">
                  <span className="text-[10px] font-bold text-navy">{speed.toFixed(2)}x</span>
                </div>
                <button
                  onClick={() => onSpeedChange(Math.min(3.0, +(speed + 0.25).toFixed(2)))}
                  disabled={speed >= 3.0}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white hover:bg-ice text-navy transition disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-sand-dark uppercase text-[10px] font-bold">EPOCH:</span>
            <span className="px-2.5 py-1 rounded-lg bg-canvas-subtle border border-ice text-navy font-bold text-xs shadow-sm">
              {activeTimelineDate ? activeTimelineDate : "MULTI-TEMPORAL PASS"}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`px-3 py-1 rounded-lg border text-xs font-mono transition flex items-center gap-1.5 font-bold ${
                autoSync
                  ? "bg-coral/10 text-coral border-coral/30"
                  : "bg-canvas-subtle text-sand-dark border-ice hover:text-navy"
              }`}
            >
              <span>AUTOSYNC // {autoSync ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
