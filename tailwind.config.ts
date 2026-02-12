import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f2f7ff",
          100: "#e6efff",
          200: "#c2d8ff",
          300: "#96bcff",
          400: "#669bff",
          500: "#4078ff",
          600: "#2456f2",
          700: "#1b44de",
          800: "#1d3ab4",
          900: "#1f378d"
        }
      }
    }
  },
  plugins: []
};

export default config;
