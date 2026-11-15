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
        radar: {
          dark: "#0b0f19",
          card: "#111827",
          border: "#1f2937",
          accent: "#06b6d4",
          highlight: "#10b981",
        }
      }
    },
  },
  plugins: [],
};
