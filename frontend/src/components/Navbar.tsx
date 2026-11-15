import React from "react";
import { Region } from "@/types";
import { Radio, Volume2, Globe, HelpCircle, Compass } from "lucide-react";

interface NavbarProps {
  regions: Region[];
  selectedRegion: Region;
  onSelectRegion: (r: Region) => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  onOpenHelp,
}) => {
  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-20 sticky top-0">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
              Land Heartbeat <span className="text-cyan-400 font-normal">| The Sound of the Land</span>
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              NISAR / SAR Sonification
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Translating satellite radar backscatter and phenological cycles into acoustic music
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Region Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
          <Globe className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          {regions.map((reg) => {
            const isSelected = reg.id === selectedRegion.id;
            return (
              <button
                key={reg.id}
                onClick={() => onSelectRegion(reg)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  isSelected
                    ? "bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {reg.name.split(",")[0]}
              </button>
            );
          })}
        </div>

        {/* Physics Explainer Button */}
        <button
          onClick={onOpenHelp}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">SAR Physics Guide</span>
        </button>
      </div>
    </header>
  );
};
