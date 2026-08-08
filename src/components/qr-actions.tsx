"use client";

import { useState } from "react";
import { Download, Lock, Check } from "lucide-react";

/**
 * Saving the QR to the camera roll from the web only works reliably through
 * the native share sheet (iOS Safari sends an <a download> to Files, not
 * Photos), so the share sheet is the primary path and download is the desktop
 * fallback.
 *
 * A true Lock Screen widget needs a native app extension, which a web app
 * can't provide — the lock-screen row saves the image and points at the OS
 * wallpaper flow rather than pretending to pin anything.
 */
export function QrActions({
  qrDataUrl,
  fileLabel,
}: {
  qrDataUrl: string;
  fileLabel: string;
}) {
  const [done, setDone] = useState<string | null>(null);
  const [hint, setHint] = useState(false);

  async function saveImage(key: string) {
    const fileName = `${fileLabel}-qr.png`;

    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
      try {
        const blob = await fetch(qrDataUrl).then((r) => r.blob());
        const file = new File([blob], fileName, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          setDone(key);
          setTimeout(() => setDone(null), 2500);
          return;
        }
      } catch {
        // Dismissed or unsupported — fall through to a plain download.
      }
    }

    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = fileName;
    a.click();
    setDone(key);
    setTimeout(() => setDone(null), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => saveImage("save")}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[var(--app-overlay)] active:bg-[var(--app-overlay-strong)]"
      >
        <span className="text-[var(--app-fg-muted)]" aria-hidden>
          {done === "save" ? (
            <Check size={20} strokeWidth={2} />
          ) : (
            <Download size={20} strokeWidth={1.8} />
          )}
        </span>
        <span className="flex-1 text-[15px] text-[var(--app-fg)]">
          {done === "save" ? "Saved" : "Save QR to photos"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setHint(true);
          saveImage("lock");
        }}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[var(--app-overlay)] active:bg-[var(--app-overlay-strong)]"
      >
        <span className="text-[var(--app-fg-muted)]" aria-hidden>
          <Lock size={20} strokeWidth={1.8} />
        </span>
        <span className="flex-1">
          <span className="block text-[15px] text-[var(--app-fg)]">
            QR on your Lock Screen
          </span>
          <span className="block text-xs text-[var(--app-fg-subtle)]">
            {hint
              ? "Saved — now set it as your wallpaper in Settings › Wallpaper"
              : "Saves the image so you can set it as wallpaper"}
          </span>
        </span>
      </button>
    </>
  );
}
