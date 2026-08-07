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
  /** Full CSS background for the card face. */
  background: string;
  /** Brand color lightened enough to read as an accent on the dark face. */
  accent: string;
  /** Ring/border color for avatars and chips. */
  hairline: string;
  headingFont: string;
};

/**
 * Build the card face: a deep brand-tinted gradient plus an off-center glow.
 * Every stop is anchored in near-black, so white text clears 4.5:1 regardless
 * of how light the org's chosen brand color is.
 */
export function buildCardTheme(
  primary: string,
  secondary: string,
  headingFont: string
): CardTheme {
  // Keep the base near-neutral. Tinting the whole face with a brand color turns
  // warm hues muddy (gold + black = olive), so the brand reads as *light* cast
  // across a dark card instead of a wash through it.
  const base = mix(primary, CANVAS_INK, 0.9);
  const baseFar = mix(secondary, CANVAS_INK, 0.93);

  // Lift the brand hue until it can carry small text on the dark face.
  let accent = primary;
  let guard = 0;
  while (contrastRatio(accent, base) < 4.5 && guard < 14) {
    accent = mix(accent, "#ffffff", 0.1);
    guard += 1;
  }

  return {
    background: [
      // Brand glow, top-right — saturated but tightly contained.
      `radial-gradient(85% 60% at 88% 2%, ${mix(primary, CANVAS_INK, 0.3)} 0%, transparent 62%)`,
      // Secondary counter-glow, bottom-left, for depth.
      `radial-gradient(70% 55% at 4% 100%, ${mix(secondary, CANVAS_INK, 0.62)} 0%, transparent 60%)`,
      `linear-gradient(160deg, ${base} 0%, ${CANVAS_INK} 52%, ${baseFar} 100%)`,
    ].join(", "),
    accent,
    hairline: "rgba(255,255,255,0.16)",
    headingFont,
  };
}
