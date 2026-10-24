export const colors = {
  background: "#F8F6F1",
  surface: "#FFFFFF",
  surfaceAlt: "#FBF8F2",
  border: "#E8E1D3",
  borderStrong: "#D8CEB8",

  // Primary gold accent — used for CTAs, highlights, rates
  primary: "#B8860B",
  primaryDark: "#8C6508",
  gold: "#C9A227",
  goldDark: "#A6821E",
  goldLight: "#F4E8C1",

  // Deep warm maroon neutral — headers, hero surfaces, dark accents (premium jewel tone)
  maroon: "#4A1620",
  maroonMuted: "#6B2430",

  text: "#1F2937",
  textMuted: "#6B7280",
  textInverse: "#FFFFFF",

  silver: "#94A3B8",
  silverDark: "#64748B",
  silverLight: "#EEF1F5",

  success: "#15803D",
  successBg: "#DCFCE7",
  warning: "#B45309",
  warningBg: "#FEF3C7",
  danger: "#B91C1C",
  dangerBg: "#FEE2E2",
  // Used only for redemption-order status tags (APPROVED/SHIPPED) — distinct from the
  // gold/maroon accent palette so those two mid-flow states read clearly at a glance.
  info: "#1D4ED8",
  infoBg: "#DBEAFE",
  indigo: "#4338CA",
  indigoBg: "#E0E7FF",

  white: "#FFFFFF",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Horizontal screen gutter — kept separate from the vertical spacing scale
// so every screen lines up edge-to-edge regardless of section spacing.
export const screenPadding = 20;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: "#1C2230",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#1C2230",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#1C2230",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
};

/** Gradient color stops for LinearGradient, kept alongside the flat palette above. */
export const gradients = {
  hero: ["#6B2430", "#2E0D16"] as const,
  heroLight: ["#FFFFFF", "#FBF3E1"] as const,
  gold: ["#D9B24C", "#B8860B"] as const,
  goldSubtle: ["#F4E8C1", "#EDDBA0"] as const,
  silver: ["#C7D0DC", "#8E9BAF"] as const,
  authBackground: ["#FBF8F2", "#F2E9D6"] as const,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "800" as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: "800" as const, color: colors.text },
  h3: { fontSize: 17, fontWeight: "700" as const, color: colors.text },
  sectionTitle: { fontSize: 15, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text },
  bodyBold: { fontSize: 15, fontWeight: "600" as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: "500" as const, color: colors.textMuted },
  small: { fontSize: 12, fontWeight: "500" as const, color: colors.textMuted },
  numberLarge: { fontSize: 30, fontWeight: "800" as const, color: colors.text },
  numberMedium: { fontSize: 20, fontWeight: "800" as const, color: colors.text },
};
