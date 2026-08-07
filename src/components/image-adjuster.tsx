"use client";

import { useRef, useState, useCallback } from "react";
import { ZoomIn, RotateCcw, Move } from "lucide-react";

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

/** Turn framing values into the transform used both here and on the card. */
export function framingStyle(f: ImageFraming): React.CSSProperties {
  return {
    transform: `translate(${f.offsetX}%, ${f.offsetY}%) scale(${f.scale})`,
    transformOrigin: "center",
  };
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 3;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Circular crop editor — drag the image to reposition, slide to zoom.
 *
 * Uploaded logos are almost always wide rectangles, so `object-contain` alone
 * shrinks them into a thin strip inside a round avatar. This lets the image be
 * framed properly instead.
 */
export function ImageAdjuster({
  src,
  value,
  onChange,
  ringColor,
}: {
  src: string;
  value: ImageFraming;
  onChange: (next: ImageFraming) => void;
  ringColor?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    frameW: number;
    frameH: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      dragState.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originX: value.offsetX,
        originY: value.offsetY,
        frameW: rect.width,
        frameH: rect.height,
      };
      // Capture so a fast drag that leaves the circle keeps tracking. This can
      // throw if the pointer isn't actually down; dragging still works without
      // capture, so don't let it break the interaction.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* no capture — drag still tracks while the pointer stays inside */
      }
      setDragging(true);
    },
    [value.offsetX, value.offsetY]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = dragState.current;
      if (!st || st.pointerId !== e.pointerId) return;
      const dxPct = ((e.clientX - st.startX) / st.frameW) * 100;
      const dyPct = ((e.clientY - st.startY) / st.frameH) * 100;
      onChange({
        ...value,
        offsetX: clamp(st.originX + dxPct, -100, 100),
        offsetY: clamp(st.originY + dyPct, -100, 100),
      });
    },
    [onChange, value]
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId === e.pointerId) {
      dragState.current = null;
      setDragging(false);
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="relative h-28 w-28 shrink-0 touch-none select-none overflow-hidden rounded-full"
          style={{
            border: `2.5px solid ${ringColor ?? "rgba(255,255,255,0.25)"}`,
            cursor: dragging ? "grabbing" : "grab",
          }}
          role="application"
          aria-label="Drag to reposition the image"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full object-contain"
            style={framingStyle(value)}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className="flex items-center gap-1.5 text-xs text-[var(--app-fg-subtle)]">
            <Move size={13} strokeWidth={1.9} aria-hidden />
            Drag the image to reposition it
          </p>

          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-[var(--app-fg-muted)]">
              <ZoomIn size={13} strokeWidth={1.9} aria-hidden />
              Zoom
            </span>
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.02}
              value={value.scale}
              onChange={(e) =>
                onChange({ ...value, scale: Number(e.target.value) })
              }
              className="h-11 w-full cursor-pointer accent-[var(--accent)]"
              aria-label="Zoom level"
            />
          </label>

          <button
            type="button"
            onClick={() => onChange(DEFAULT_FRAMING)}
            className="inline-flex min-h-[36px] items-center gap-1.5 text-xs text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-white"
          >
            <RotateCcw size={13} strokeWidth={1.9} aria-hidden />
            Reset framing
          </button>
        </div>
      </div>
    </div>
  );
}
