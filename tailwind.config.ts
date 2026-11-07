import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17181C",
        chalk: "#F5F4F1",
        peacock: { DEFAULT: "#0E5A5A", dark: "#0A4343", light: "#D6E8E6" },
        marigold: { DEFAULT: "#E3A23B", dark: "#B97F1E" },
        mist: "#E4E2DC",
        stone: "#6B6A66",
      },
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', "Palatino", "Georgia", "serif"],
        sans: ["ui-sans-serif", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      borderRadius: { card: "14px" },
    },
  },
  plugins: [],
};
export default config;
