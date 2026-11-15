import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Land Heartbeat | The Sound of the Land (NASA Space Apps)",
  description: "Translating satellite Synthetic Aperture Radar (SAR) polarimetry and decadal phenological dynamics into multi-sensory visualizations and acoustic sonification.",
  keywords: [
    "NASA Space Apps 2026",
    "Synthetic Aperture Radar",
    "SAR Sonification",
    "Land Heartbeat",
    "Sentinel-1",
    "NISAR",
    "Phenology",
    "Earth Observation"
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-[#06090e] text-slate-100 antialiased min-h-screen selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
