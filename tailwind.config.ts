import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        rev: {
          bg: "#0A0A12",
          surface: "#12121E",
          card: "#1A1A2E",
          elevated: "#222236",
          purple: "#6C5CE7",
          "purple-light": "#A29BFE",
          cyan: "#00D2FF",
          green: "#0ACF83",
          red: "#FF4757",
          amber: "#FFBE0B",
          ink: "#EAEAF0",
          muted: "#6B6B80",
          border: "#2A2A3E",
          shell: "#16162A"
        }
      },
      borderRadius: {
        card: "20px"
      },
      boxShadow: {
        shell: "0 18px 50px rgba(0, 0, 0, 0.35)",
        card: "0 8px 32px rgba(0, 0, 0, 0.25)",
        glow: "0 0 20px rgba(108, 92, 231, 0.25)"
      }
    }
  },
  plugins: []
};

export default config;
