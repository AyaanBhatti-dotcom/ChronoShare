/** Solarpunk × Frutiger Aero — glossy sky, aqua, grass, and sunlight tones */
export const aero = {
  sky: "#6EC6E8",
  skyLight: "#C5EBFA",
  skyPale: "#E8F7FC",
  skyDeep: "#1B5F7A",
  aqua: "#2DD4C8",
  aquaBright: "#5EFFF0",
  aquaDeep: "#18A89E",
  grass: "#5BC77A",
  grassLight: "#9AE0AE",
  grassDeep: "#3D8B5E",
  sun: "#FFD166",
  sunWarm: "#F4A836",
  moss: "#2E7D52",
  white: "#FFFFFF",
  text: "#1B5F7A",
  textMuted: "#4A8FAD",
  textFaint: "#7AB8CC",
  textLight: "#FFFFFF",

  gradientBg:
    "linear-gradient(160deg, #C5EBFA 0%, #8ED4F0 22%, #5ECEE8 45%, #3DD9C8 68%, #7AD99A 88%, #B8E8A0 100%)",
  gradientBtn:
    "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, #8ED4F0 35%, #3DD9C8 100%)",
  gradientProgress: "linear-gradient(90deg, #6EC6E8, #2DD4C8, #5BC77A)",
  gradientIcon: "linear-gradient(135deg, #8ED4F0 0%, #3DD9C8 50%, #5BC77A 100%)",
  gradientAvatar: "linear-gradient(135deg, #8ED4F0 0%, #3DD9C8 45%, #5BC77A 100%)",
  gradientPrimary: "linear-gradient(135deg, #6EC6E8 0%, #3DD9C8 50%, #5BC77A 100%)",
  gradientSubmit: "linear-gradient(135deg, #5ECEE8 0%, #3DD9C8 45%, #5BC77A 100%)",

  glass: {
    background: "rgba(255, 255, 255, 0.62)",
    border: "rgba(255, 255, 255, 0.85)",
    shadow:
      "0 8px 32px rgba(58, 158, 196, 0.28), 0 2px 8px rgba(45, 212, 200, 0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
    backdrop: "blur(16px) saturate(1.4)",
  },

  glassCard: {
    background: "rgba(255, 255, 255, 0.48)",
    border: "rgba(255, 255, 255, 0.7)",
    shadow: "0 4px 16px rgba(58, 158, 196, 0.18), inset 0 1px 0 rgba(255,255,255,0.75)",
  },

  overlay: "rgba(26, 95, 122, 0.42)",
  spotlightRing:
    "0 0 0 3px #5EFFF0, 0 0 24px rgba(94, 255, 240, 0.55), 0 0 48px rgba(45, 212, 200, 0.25)",
} as const;

/** Semantic colors for hour impact / exchange badges */
export const dashColors = {
  earn: aero.grassDeep,
  earnBg: "rgba(91, 199, 122, 0.22)",
  earnBorder: "rgba(91, 199, 122, 0.4)",
  spend: aero.skyDeep,
  spendBg: "rgba(58, 158, 196, 0.22)",
  spendBorder: "rgba(58, 158, 196, 0.4)",
  neutral: aero.textMuted,
  neutralBg: "rgba(74, 143, 173, 0.15)",
  neutralBorder: "rgba(74, 143, 173, 0.3)",
  ownBorder: "rgba(45, 212, 200, 0.55)",
  hours: aero.aquaDeep,
  sun: aero.sunWarm,
} as const;

export function impactBadgeStyle(direction: "earn" | "spend" | "free" | "neutral") {
  if (direction === "earn") {
    return { background: dashColors.earnBg, color: dashColors.earn, border: `1px solid ${dashColors.earnBorder}` };
  }
  if (direction === "spend") {
    return { background: dashColors.spendBg, color: dashColors.spend, border: `1px solid ${dashColors.spendBorder}` };
  }
  return { background: dashColors.neutralBg, color: dashColors.neutral, border: `1px solid ${dashColors.neutralBorder}` };
}

export function impactPanelStyle(direction: "earn" | "spend" | "free") {
  if (direction === "earn") {
    return { background: dashColors.earnBg, border: `1px solid ${dashColors.earnBorder}` };
  }
  if (direction === "spend") {
    return { background: dashColors.spendBg, border: `1px solid ${dashColors.spendBorder}` };
  }
  return { background: dashColors.neutralBg, border: `1px solid ${dashColors.neutralBorder}` };
}

export function AeroBackground() {
  return (
    <div className="dash-aero-scene" aria-hidden="true">
      <div className="dash-aero-sky" />
      <div className="dash-aero-sun" />
      <div className="dash-aero-ocean" />
      <div className="dash-aero-wave dash-aero-wave-1" />
      <div className="dash-aero-wave dash-aero-wave-2" />
      <div className="dash-aero-shimmer-grid" />
      <div className="dash-aero-grass dash-aero-grass-back" />
      <div className="dash-aero-grass dash-aero-grass-front" />
      <div className="dash-aero-orb dash-aero-orb-aqua" />
      <div className="dash-aero-orb dash-aero-orb-grass" />
      <div className="dash-aero-spark dash-aero-spark-1" />
      <div className="dash-aero-spark dash-aero-spark-2" />
      <div className="dash-aero-spark dash-aero-spark-3" />
    </div>
  );
}
