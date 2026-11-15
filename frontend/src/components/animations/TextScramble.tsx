"use client";

import React, { useEffect, useState, useRef } from "react";

interface TextScrambleProps {
  text: string;
  className?: string;
  speed?: number;
  trigger?: boolean;
}

const CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_//--+*#";

export const TextScramble: React.FC<TextScrambleProps> = ({
  text,
  className = "",
  speed = 28,
  trigger = true,
}) => {
  const [displayText, setDisplayText] = useState(text);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!trigger || animatingRef.current) return;
    animatingRef.current = true;
    let iteration = 0;
    const maxIterations = text.length;

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (char === " " || char === "\n") return char;
            if (index < iteration) return text[index];
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          })
          .join("")
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
        animatingRef.current = false;
        setDisplayText(text);
      }

      iteration += 1 / 2;
    }, speed);

    return () => clearInterval(interval);
  }, [text, trigger, speed]);

  return <span className={className}>{displayText}</span>;
};
