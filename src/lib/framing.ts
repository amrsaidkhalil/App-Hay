/**
 * Image framing shared by the client-side adjuster and the server-rendered
 * card.
 *
 * This deliberately lives outside the "use client" module: a plain function
 * exported from a client module becomes a client reference, and calling it
 * during server rendering throws ("Attempted to call framingStyle() from the
 * server"). Keeping it here lets both sides use the exact same math, so the
 * preview and the real card can't drift.
 */
export type ImageFraming = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_FRAMING: ImageFraming = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

export const FRAMING_MIN_SCALE = 0.4;
export const FRAMING_MAX_SCALE = 3;

export function framingStyle(f: ImageFraming): React.CSSProperties {
  return {
    transform: `translate(${f.offsetX}%, ${f.offsetY}%) scale(${f.scale})`,
    transformOrigin: "center",
  };
}
