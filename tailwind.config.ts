import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#b9ddfe",
          300: "#7cc1fd",
          400: "#36a1fa",
          500: "#0c83eb",
          600: "#0166c9",
          700: "#0252a3",
          800: "#064686",
          900: "#0b3b6f",
          950: "#07264a",
        },
        brand: {
          blue: "#1e40af",
          lightBlue: "#3b82f6",
          sky: "#60a5fa",
          cyan: "#0284c7",
          darkNavy: "#0f172a",
        },
      },
      keyframes: {
        ripple: {
          "0%": { transform: "scale(0.85)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.04)" },
        },
      },
      animation: {
        ripple: "ripple 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
