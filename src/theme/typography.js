import { responsiveFont } from '../utils/responsive';

export { responsiveFont };

export const FONT_SIZES = {
  h1: responsiveFont(28),
  h2: responsiveFont(24),
  h3: responsiveFont(20),
  title: responsiveFont(18),
  body: responsiveFont(16),
  bodySmall: responsiveFont(14),
  caption: responsiveFont(12),
};

export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semiBold: "600",
  bold: "700",
};

export const TYPOGRAPHY = {
  // 1. Core Responsive Main Text Presets (Headings, titles, prices, cards)
  mainText: {
    fontSize: responsiveFont(16),
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(responsiveFont(16) * 1.3),
  },
  mainTitle: {
    fontSize: responsiveFont(22),
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(responsiveFont(22) * 1.3),
  },

  // 2. Core Responsive Sub Text Presets (Descriptions, subtitles, labels, hints)
  subText: {
    fontSize: responsiveFont(13),
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: Math.round(responsiveFont(13) * 1.35),
  },
  subDescription: {
    fontSize: responsiveFont(11),
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: Math.round(responsiveFont(11) * 1.35),
  },

  // Standard Presets with responsiveFont
  h1: {
    fontSize: FONT_SIZES.h1,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(FONT_SIZES.h1 * 1.25),
  },
  h2: {
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(FONT_SIZES.h2 * 1.25),
  },
  h3: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: Math.round(FONT_SIZES.h3 * 1.3),
  },
  // Aliases for heading hierarchy
  heading1: {
    fontSize: FONT_SIZES.h1,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(FONT_SIZES.h1 * 1.25),
  },
  heading2: {
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: Math.round(FONT_SIZES.h2 * 1.25),
  },
  heading3: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: Math.round(FONT_SIZES.h3 * 1.3),
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: Math.round(FONT_SIZES.title * 1.3),
  },
  body: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: Math.round(FONT_SIZES.body * 1.35),
  },
  bodyMedium: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: Math.round(FONT_SIZES.body * 1.35),
  },
  bodySmall: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: Math.round(FONT_SIZES.bodySmall * 1.35),
  },
  caption: {
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: Math.round(FONT_SIZES.caption * 1.35),
  },
  button: {
    fontSize: responsiveFont(15),
    fontWeight: FONT_WEIGHTS.semiBold,
    lineHeight: Math.round(responsiveFont(15) * 1.25),
  },
};

export default TYPOGRAPHY;
