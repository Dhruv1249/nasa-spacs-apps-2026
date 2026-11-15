"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Region } from "@/types";
import { FALLBACK_REGIONS } from "@/lib/api";
import { ScrollProgressBar } from "@/components/animations/ScrollProgressBar";
import {
  Radio,
  HelpCircle,
  Menu,
  X,
  ArrowRight
} from "lucide-react";

interface NavbarProps {
  regions?: Region[];
  selectedRegion?: Region;
  onSelectRegion?: (r: Region) => void;
  onOpenHelp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  regions = FALLBACK_REGIONS,
  selectedRegion = FALLBACK_REGIONS[0],
  onSelectRegion,
  onOpenHelp,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Overview", href: "/" },
    { label: "Explorer", href: "/explorer" },
    { label: "Catalog", href: "/catalog" },
    { label: "Science", href: "/science" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/90 border-b border-ice px-4 lg:px-8 h-14 flex items-center justify-between transition-all relative shadow-[0_2px_12px_-3px_rgba(16,37,66,0.05)]">
      {/* Scroll Progress Hairline Bar */}
      <ScrollProgressBar />

      {/* Left: EnduroSat-Style Minimal Aerospace Wordmark */}
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="relative w-7 h-7 rounded-lg bg-navy/5 border border-navy/15 flex items-center justify-center shadow-xs group-hover:border-coral transition-colors">
            <Radio className="w-3.5 h-3.5 text-navy group-hover:text-coral transition-colors" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-coral shadow-xs shadow-coral" />
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-navy text-xs sm:text-sm tracking-[0.18em] uppercase">
              Land Heartbeat
            </span>
            <span className="hidden sm:inline-flex items-center text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-ice/40 text-navy/70 border border-ice">
              NASA 2026
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Sleek Floating Pill Navigation Bar (Desktop) */}
      <nav className="hidden md:flex items-center space-x-0.5 bg-canvas-subtle border border-ice rounded-full p-1 shadow-xs">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-1 rounded-full text-xs transition-all relative ${
                isActive
                  ? "bg-navy text-white font-semibold shadow-xs"
                  : "text-navy/70 hover:text-navy hover:bg-white/80"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right: Region Switcher & Quick Action */}
      <div className="hidden sm:flex items-center space-x-3">
        {/* Compact Segmented Region Toggle */}
        {regions && regions.length > 0 && (
          <div className="bg-canvas-subtle border border-ice rounded-full p-0.5 flex items-center text-[11px] font-medium shadow-inner">
            {regions.map((reg) => {
              const isSelected = reg.id === selectedRegion.id;
              const shortName = reg.name.split(",")[0].trim();
              if (onSelectRegion) {
                return (
                  <button
                    key={reg.id}
                    onClick={() => onSelectRegion(reg)}
                    className={`px-3 py-1 rounded-full transition-all ${
                      isSelected
                        ? "bg-coral text-white font-bold shadow-xs shadow-coral/30"
                        : "text-navy/70 hover:text-navy"
                    }`}
                  >
                    {shortName}
                  </button>
                );
              }
              return (
                <Link
                  key={reg.id}
                  href={`/explorer?region=${reg.id}`}
                  className={`px-3 py-1 rounded-full transition-all ${
                    isSelected
                      ? "bg-coral text-white font-bold shadow-xs shadow-coral/30"
                      : "text-navy/70 hover:text-navy"
                  }`}
                >
                  {shortName}
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA / Action */}
        {pathname !== "/explorer" ? (
          <Link
            href="/explorer"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-coral hover:bg-coral-dark text-white text-xs font-semibold transition shadow-xs shadow-coral/25 group"
          >
            <span>Live Explorer</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-white" />
          </Link>
        ) : onOpenHelp ? (
          <button
            onClick={onOpenHelp}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-canvas-subtle text-navy text-xs border border-ice transition shadow-xs"
            title="SAR Physics and Sonification Architecture"
          >
            <HelpCircle className="w-3.5 h-3.5 text-coral" />
            <span>Guide</span>
          </button>
        ) : null}
      </div>

      {/* Mobile Hamburger Toggle */}
      <div className="flex md:hidden items-center space-x-2">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-navy/70 hover:text-navy hover:bg-canvas-subtle transition"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 w-full backdrop-blur-2xl bg-white/95 border-b border-ice p-4 space-y-3 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? "bg-navy text-white font-semibold"
                      : "text-navy/70 hover:text-navy hover:bg-canvas-subtle"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {regions && (
            <div className="pt-2 border-t border-ice space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-navy/50 font-semibold font-mono">
                Region Target
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {regions.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => {
                      if (onSelectRegion) onSelectRegion(reg);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium text-center truncate transition ${
                      reg.id === selectedRegion.id
                        ? "bg-coral text-white font-bold"
                        : "bg-canvas-subtle text-navy border border-ice"
                    }`}
                  >
                    {reg.name.split(",")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
