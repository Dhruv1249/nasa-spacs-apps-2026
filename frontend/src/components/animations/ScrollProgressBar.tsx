"use client";

import React, { useEffect, useState } from "react";

export const ScrollProgressBar: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-transparent pointer-events-none overflow-hidden z-50">
      <div
        className="h-full bg-gradient-to-r from-navy via-coral to-sand transition-all duration-75 shadow-[0_0_8px_rgba(248,112,96,0.5)]"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};
