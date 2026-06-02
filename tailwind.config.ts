import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // Manchester City sky-blue scale (the hero accent).
        brand: {
          50: "#eaf4fb",
          100: "#d4e9f6",
          200: "#b3d8ef",
          300: "#8fc4e7",
          400: "#7bb8e2",
          500: "#6cabdd",
          DEFAULT: "#6cabdd",
          600: "#3f8fcc",
          700: "#2f6fa8",
          dark: "#2f6fa8",
        },
        // Navy ink (from the PSC crest) — headings + primary fills for contrast.
        ink: {
          DEFAULT: "#1c2c5b",
          light: "#2a3d72",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        float: "0 8px 24px rgba(28, 44, 91, 0.18)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "sheet-up": "sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        "slide-up": "slide-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
