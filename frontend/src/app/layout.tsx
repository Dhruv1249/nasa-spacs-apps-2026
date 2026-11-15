import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Land Heartbeat | The Sound of the Land (NASA Space Apps)",
  description: "Translating satellite Synthetic Aperture Radar (SAR) backscatter time series and phenological cycles into interactive acoustic music.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
