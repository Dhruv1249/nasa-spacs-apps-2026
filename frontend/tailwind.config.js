/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#102542", // Deep Space Navy / Prussian Blue
          dark: "#0a172a",
          light: "#1d3d6b",
          muted: "#334e68",
        },
        coral: {
          DEFAULT: "#f87060", // Rocket Flame / Electric Coral
          light: "#fa9185",
          dark: "#e04f3d",
        },
        ice: {
          DEFAULT: "#cdd7d6", // Soft Platinum / Ice Silver
          light: "#eef3f2",
          dark: "#a5b7b5",
        },
        sand: {
          DEFAULT: "#241e19", // Deep Roasted Espresso / Dark Mineral
          light: "#3d332b",
          dark: "#14100d",
        },
        canvas: {
          DEFAULT: "#f8fafc", // Subtle Light Aerospace Base
          card: "#ffffff",
          subtle: "#f1f5f9",
          border: "#cdd7d6",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Courier New",
          "monospace"
        ]
      }
    },
  },
  plugins: [],
};
