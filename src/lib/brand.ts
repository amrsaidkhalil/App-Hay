/**
 * Brand color math for card rendering.
 *
 * Cards are tinted with each org's real brand color rather than one fixed
 * palette, so a Bilaal TV card and an Al-Iman card look like *their* brands.
 * The catch is that arbitrary brand colors (a bright gold, a pale pink) can't
 * carry white text at 4.5:1. So we never paint the brand color raw — we mix it
 * into a near-black base to build the gradient, which keeps white text legible
 * no matter what color an org picks, while the hue still reads as theirs.
 */

const CANVAS_INK = "#080d18";

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int) || full.length !== 6) return [15, 23, 42];
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Blend `amount` (0–1) of `b` into `a`. */
export function mix(a: string, b: string, amount: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount
  );
}

/** Relative luminance per WCAG 2.1. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white — whichever is actually readable on `bg`. */
export function readableOn(bg: string) {
  return contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#0b1120")
    ? "#ffffff"
    : "#0b1120";
}

export type CardTheme = {
  /** Solid card background. */
  background: string;
  /** Text printed on the card. */
  text: string;
  /** Accent — logo ring and QR modules. */
  accent: string;
  /** Muted version of the text color, for the secondary line. */
  textMuted: string;
  /** Hairline border that reads against the background either way. */
  hairline: string;
  /** QR module color, darkened if needed so the code still scans. */
  qrDark: string;
  headingFont: string;
};

/**
 * Build the card face: a deep brand-tinted gradient plus an off-center glow.
 * Every stop is anchored in near-black, so white text clears 4.5:1 regardless
 * of how light the org's chosen brand color is.
 */
/**
 * Build the card face from three explicit brand colors: a solid background,
 * a text color, and an accent.
 *
 * Two things get corrected rather than trusted:
 *  - The accent is nudged until it's actually visible against the background.
 *    A brand's accent can legitimately sit very close to its background color,
 *    which would make the logo ring invisible.
 *  - The QR modules are darkened until they clear 7:1 against the white quiet
 *    zone. Camera scanners need real contrast, and a pale accent would produce
 *    a code that looks right but won't scan — a silent failure in front of the
 *    person you just handed your phone to.
 */
export function buildCardTheme(
  primary: string,
  text: string,
  secondary: string,
  headingFont: string
): CardTheme {
  // These come straight from DB rows. A missing value should degrade to a
  // readable default, not throw and take down the whole card page.
  const background = primary || "#111827";
  text = text || "#ffffff";
  secondary = secondary || "#34d399";
  headingFont = headingFont || "Poppins";

  let accent = secondary;
  let guard = 0;
  while (contrastRatio(accent, background) < 1.9 && guard < 16) {
    // Push away from the background: lighten a dark bg's accent, darken a light one's.
    accent = mix(accent, luminance(background) > 0.4 ? "#000000" : "#ffffff", 0.09);
    guard += 1;
  }

  let qrDark = secondary;
  guard = 0;
  while (contrastRatio(qrDark, "#ffffff") < 7 && guard < 20) {
    qrDark = mix(qrDark, CANVAS_INK, 0.12);
    guard += 1;
  }

  const towardBg = mix(text, background, 0.32);

  return {
    background,
    text,
    accent,
    textMuted: towardBg,
    hairline: mix(text, background, 0.72),
    qrDark,
    headingFont,
  };
}
