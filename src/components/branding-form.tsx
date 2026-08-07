"use client";

import { useState, useRef } from "react";
import {
  Check,
  ImagePlus,
  Loader2,
  Trash2,
  Type,
  AlertTriangle,
} from "lucide-react";
import { BrandCard } from "./brand-card";
import { ImageAdjuster } from "./image-adjuster";
import { DEFAULT_FRAMING, type ImageFraming } from "@/lib/framing";
import { contrastRatio } from "@/lib/brand";
import { cn } from "@/lib/utils";

// A starting palette so a brand can be set up in one tap. Custom hex is always
// available below, so this is a shortcut, not a limit.
const PRESETS = [
  "#0a0a0a",
  "#1c1917",
  "#1e293b",
  "#ffffff",
  "#e9b216",
  "#f97316",
  "#dc2626",
  "#db2777",
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#16a34a",
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function SwatchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  function commit(next: string) {
    const withHash = next.startsWith("#") ? next : `#${next}`;
    setDraft(withHash);
    if (HEX_RE.test(withHash)) onChange(withHash.toLowerCase());
  }

  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
        {label}
      </span>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((hex) => {
          const active = hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              onClick={() => {
                setDraft(hex);
                onChange(hex);
              }}
              aria-label={`Use ${hex}`}
              aria-pressed={active}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200",
                active
                  ? "ring-2 ring-[var(--app-fg)] ring-offset-2 ring-offset-[var(--app-bg)]"
                  : "ring-1 ring-[var(--app-border-strong)] hover:scale-105"
              )}
              style={{ background: hex }}
            >
              {active ? (
                <Check size={16} strokeWidth={3} className="text-white drop-shadow" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full ring-1 ring-[var(--app-border-strong)]">
          <span className="sr-only">Pick a custom {label.toLowerCase()}</span>
          <input
            type="color"
            value={HEX_RE.test(draft) ? draft : value}
            onChange={(e) => commit(e.target.value)}
            className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
        <input
          value={draft}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          aria-label={`${label} hex value`}
          className="input font-mono uppercase"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

/**
 * Live contrast readout. The user now picks the background and text colors
 * directly, so nothing guarantees they're readable — this surfaces the problem
 * while they're choosing instead of after the card is printed.
 */
function ContrastNotice({ bg, text }: { bg: string; text: string }) {
  const ratio = contrastRatio(bg, text);
  const ok = ratio >= 4.5;
  return (
    <p
      className={cn(
        "mt-3 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed",
        ok ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-800"
      )}
    >
      {ok ? (
        <Check size={14} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <AlertTriangle size={14} strokeWidth={2.2} className="mt-0.5 shrink-0" aria-hidden />
      )}
      <span>
        Text contrast {ratio.toFixed(1)}:1 —{" "}
        {ok
          ? "easy to read."
          : "too low. Aim for 4.5:1 so the card stays legible in sunlight."}
      </span>
    </p>
  );
}

export function BrandingForm({
  orgSlug,
  initial,
  ownerName,
  canUpload,
  saveAction,
  uploadAction,
}: {
  orgSlug: string;
  ownerName: string;
  canUpload: boolean;
  initial: {
    name: string;
    logoUrl: string;
    logoFraming: ImageFraming;
    primaryColor: string;
    textColor: string;
    secondaryColor: string;
    headingFont: string;
  };
  saveAction: (formData: FormData) => void;
  uploadAction: (
    formData: FormData
  ) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
}) {
  const [name, setName] = useState(initial.name);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [framing, setFraming] = useState<ImageFraming>(initial.logoFraming);
  const [primary, setPrimary] = useState(initial.primaryColor);
  const [textColor, setTextColor] = useState(initial.textColor);
  const [secondary, setSecondary] = useState(initial.secondaryColor);
  const [headingFont, setHeadingFont] = useState(initial.headingFont);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("orgSlug", orgSlug);
      const result = await uploadAction(fd);
      if (result.ok) {
        setLogoUrl(result.url);
        // A new logo has its own proportions — old framing wouldn't apply.
        setFraming(DEFAULT_FRAMING);
      } else setUploadError(result.error);
    } catch {
      setUploadError("Upload failed — the image may be too large.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <form action={saveAction} className="space-y-7">
        <input type="hidden" name="slug" value={orgSlug} />
        <input type="hidden" name="logoUrl" value={logoUrl} />
        <input type="hidden" name="logoScale" value={framing.scale} />
        <input type="hidden" name="logoOffsetX" value={framing.offsetX} />
        <input type="hidden" name="logoOffsetY" value={framing.offsetY} />
        <input type="hidden" name="primaryColor" value={primary} />
        <input type="hidden" name="textColor" value={textColor} />
        <input type="hidden" name="secondaryColor" value={secondary} />
        <input type="hidden" name="headingFont" value={headingFont} />

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Organization name
          </span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </label>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Logo
          </span>
          <div className="flex items-center gap-3">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)]">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Current logo"
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <ImagePlus
                  size={20}
                  strokeWidth={1.8}
                  className="text-[var(--app-fg-subtle)]"
                  aria-hidden
                />
              )}
            </span>

            <div className="flex flex-1 flex-wrap gap-2">
              <label
                className={cn(
                  "btn-ghost cursor-pointer text-sm",
                  (!canUpload || uploading) && "pointer-events-none opacity-50"
                )}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={onPickLogo}
                  disabled={!canUpload || uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    Uploading…
                  </>
                ) : (
                  <>
                    <ImagePlus size={16} strokeWidth={1.8} aria-hidden />
                    {logoUrl ? "Replace" : "Upload logo"}
                  </>
                )}
              </label>
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="btn-ghost text-sm"
                >
                  <Trash2 size={16} strokeWidth={1.8} aria-hidden />
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          {!canUpload ? (
            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs text-[var(--app-fg-subtle)]">
                Image hosting isn&apos;t set up — paste a logo URL instead.
              </span>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…/logo.png"
                className="input"
              />
            </label>
          ) : null}

          {uploadError ? (
            <p className="mt-2 text-xs text-[var(--danger)]">{uploadError}</p>
          ) : null}

          {logoUrl ? (
            <div className="mt-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
                Fit the logo in the circle
              </p>
              <ImageAdjuster
                src={logoUrl}
                value={framing}
                onChange={setFraming}
                ringColor={secondary}
              />
            </div>
          ) : null}
        </div>

        <div>
          <SwatchRow
            label="Card background"
            value={primary}
            onChange={setPrimary}
          />
        </div>

        <div>
          <SwatchRow label="Text color" value={textColor} onChange={setTextColor} />
          <ContrastNotice bg={primary} text={textColor} />
        </div>

        <div>
          <SwatchRow
            label="Accent (logo ring + QR)"
            value={secondary}
            onChange={setSecondary}
          />
        </div>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Heading font
          </span>
          <div className="grid grid-cols-2 gap-2">
            {["Poppins", "Poetsen One"].map((font) => {
              const active = headingFont === font;
              return (
                <button
                  key={font}
                  type="button"
                  onClick={() => setHeadingFont(font)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-[56px] items-center justify-center gap-2 rounded-xl border text-[15px] transition-colors duration-200",
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]"
                      : "border-[var(--app-border-strong)] text-[var(--app-fg-muted)] hover:bg-[var(--app-overlay)]"
                  )}
                  style={
                    font === "Poetsen One"
                      ? { fontFamily: "var(--font-poetsen)" }
                      : undefined
                  }
                >
                  <Type size={15} strokeWidth={1.8} aria-hidden />
                  {font}
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto">
          Save branding
        </button>
      </form>

      <div className="lg:sticky lg:top-24">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
          Live preview
        </p>
        <BrandCard
          data={{
            name: ownerName,
            jobTitle: "Founder & Director",
            orgName: name || "Your brand",
            logoUrl: logoUrl || null,
            logoFraming: framing,
            photoUrl: null,
            primaryColor: primary,
            textColor,
            secondaryColor: secondary,
            headingFont,
          }}
          size="sm"
        />
        <p className="mt-3 text-xs leading-relaxed text-[var(--app-fg-subtle)]">
          These colors apply to every card under this brand.
        </p>
      </div>
    </div>
  );
}
