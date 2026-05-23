import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#ffffff",
        background: "#faf8ff",
        surface: "#faf8ff",
        "surface-dim": "#d9d9e5",
        "surface-bright": "#faf8ff",
        "surface-variant": "#e2e1ed",
        paper: "#ffffff",
        cloud: "#f7f7f7",
        fog: "#e8e8e8",
        ink: "#1a1a1a",
        "ink-deep": "#000000",
        "ink-soft": "#292929",
        charcoal: "#3d3d3d",
        text: "#191b23",
        "on-background": "#191b23",
        "on-surface": "#191b23",
        "on-surface-variant": "#434655",
        "inverse-surface": "#2e3039",
        "inverse-on-surface": "#f0f0fc",
        graphite: "#636363",
        secondary: "#5f5e5e",
        "secondary-container": "#e2dfde",
        "secondary-fixed": "#e5e2e1",
        "secondary-fixed-dim": "#c8c6c5",
        steel: "#c2c2c2",
        outline: "#747686",
        "outline-variant": "#c3c5d7",
        line: "#e2e1ed",
        "line-strong": "#c3c5d7",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f3f2ff",
        "surface-container": "#ededf9",
        "surface-container-high": "#e7e7f3",
        "surface-container-highest": "#e2e1ed",
        primary: "#0036a4",
        "primary-container": "#024ad8",
        "primary-deep": "#0e3191",
        "primary-bright": "#296ef9",
        "primary-soft": "#c9e0fc",
        "primary-fixed": "#dce1ff",
        "primary-fixed-dim": "#b6c4ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#c2ceff",
        "inverse-primary": "#b6c4ff",
        "storm-sea": "#7fadbe",
        "storm-mist": "#8ebdce",
        "storm-deep": "#356373",
        "bloom-coral": "#ff5050",
        "bloom-rose": "#f9d4d2",
        "bloom-deep": "#b3262b",
        "bloom-wine": "#5a1313",
        danger: "#b3262b",
        error: "#ba1a1a",
        "error-container": "#ffdad6"
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        xxl: "32px",
        section: "80px"
      },
      borderRadius: {
        none: "0",
        xs: "2px",
        sm: "3px",
        DEFAULT: "4px",
        md: "4px",
        lg: "8px",
        xl: "16px",
        "2xl": "24px",
        "16": "16px",
        full: "9999px"
      },
      fontFamily: {
        sans: ["Manrope", "Microsoft YaHei", "PingFang SC", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
      },
      fontSize: {
        "display-xxl": ["72px", { lineHeight: "1", fontWeight: "500" }],
        "display-xl": ["56px", { lineHeight: "1", fontWeight: "500" }],
        "display-lg": ["44px", { lineHeight: "1", fontWeight: "500" }],
        "display-md": ["32px", { lineHeight: "1", fontWeight: "500" }],
        "display-sm": ["24px", { lineHeight: "1.17", fontWeight: "500" }],
        "display-xs": ["20px", { lineHeight: "1", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "1.33", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.38", fontWeight: "400" }],
        "body-emphasis": ["16px", { lineHeight: "1.38", fontWeight: "500" }],
        "caption-md": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "caption-bold": ["14px", { lineHeight: "1.3", fontWeight: "700" }],
        "caption-sm": ["12px", { lineHeight: "1.33", fontWeight: "400" }],
        "link-md": ["16px", { lineHeight: "1.38", fontWeight: "500" }],
        "button-md": ["14px", { lineHeight: "1.4", letterSpacing: "0.7px", fontWeight: "600" }],
        "button-sm": ["12.6px", { lineHeight: "1", letterSpacing: "0.126px", fontWeight: "700" }],
        "price-md": ["24px", { lineHeight: "1.17", fontWeight: "500" }]
      },
      boxShadow: {
        lift: "0 18px 60px rgba(25, 27, 35, 0.10)",
        card: "0 8px 30px rgba(25, 27, 35, 0.06)",
        "soft-lift": "0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.02)",
        modal: "0 24px 70px rgba(25, 27, 35, 0.18), 0 6px 18px rgba(25, 27, 35, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
