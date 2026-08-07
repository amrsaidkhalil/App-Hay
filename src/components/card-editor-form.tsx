"use client";

import { useState, useRef } from "react";
import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  Link2,
  ImagePlus,
  Loader2,
  Trash2,
  Briefcase,
} from "lucide-react";
import { BrandCard, type BrandCardData } from "./brand-card";
import { ImageAdjuster } from "./image-adjuster";
import { DEFAULT_FRAMING, type ImageFraming } from "@/lib/framing";
import {
  InstagramGlyph,
  LinkedinGlyph,
  XGlyph,
  FacebookGlyph,
} from "./social-icons";
import { cn } from "@/lib/utils";

export type CardFormValues = {
  jobTitle: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  facebook: string;
};

type Theme = {
  primaryColor: string;
  textColor: string;
  secondaryColor: string;
  headingFont: string;
  logoUrl: string | null;
  logoFraming: ImageFraming;
};

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[var(--app-fg-muted)]">
        {icon}
        {label}
      </span>
      {children}
      {hint}
    </label>
  );
}

export function CardEditorForm({
  orgSlug,
  orgName,
  ownerName,
  cardSlug,
  theme,
  initialPhoto,
  initialPhotoFraming,
  initial,
  canUpload,
  saveAction,
  uploadAction,
}: {
  orgSlug: string;
  orgName: string;
  ownerName: string;
  cardSlug: string;
  theme: Theme;
  initialPhoto: string;
  initialPhotoFraming: ImageFraming;
  initial: CardFormValues;
  canUpload: boolean;
  saveAction: (formData: FormData) => void;
  uploadAction: (
    formData: FormData
  ) => Promise<{ ok: true; url: string } | { ok: false; error: string }>;
}) {
  const [values, setValues] = useState<CardFormValues>(initial);
  const [slug, setSlug] = useState(cardSlug);
  const [photoUrl, setPhotoUrl] = useState(initialPhoto);
  const [framing, setFraming] = useState<ImageFraming>(initialPhotoFraming);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function bind(key: keyof CardFormValues) {
    return {
      value: values[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setValues((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
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
        setPhotoUrl(result.url);
        // A new image has its own proportions — old framing wouldn't apply.
        setFraming(DEFAULT_FRAMING);
      } else setUploadError(result.error);
    } catch {
      setUploadError("Upload failed — the image may be too large.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const preview: BrandCardData = {
    name: ownerName,
    jobTitle: values.jobTitle,
    orgName,
    logoUrl: theme.logoUrl,
    logoFraming: theme.logoFraming,
    photoUrl: photoUrl || null,
    photoFraming: framing,
    primaryColor: theme.primaryColor,
    textColor: theme.textColor,
    secondaryColor: theme.secondaryColor,
    headingFont: theme.headingFont,
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
      <form action={saveAction} className="space-y-7">
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <input type="hidden" name="photoUrl" value={photoUrl} />
        <input type="hidden" name="photoScale" value={framing.scale} />
        <input type="hidden" name="photoOffsetX" value={framing.offsetX} />
        <input type="hidden" name="photoOffsetY" value={framing.offsetY} />

        <section className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
            Photo
          </h2>
          <div className="flex items-center gap-3">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--app-border)] bg-[var(--app-surface-2)]">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Your card photo"
                  className="h-full w-full object-cover"
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
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={onPickPhoto}
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
                    {photoUrl ? "Replace" : "Upload photo"}
                  </>
                )}
              </label>
              {photoUrl ? (
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="btn-ghost text-sm"
                >
                  <Trash2 size={16} strokeWidth={1.8} aria-hidden />
                  Remove
                </button>
              ) : null}
            </div>
          </div>
          {!canUpload ? (
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…/photo.jpg"
              aria-label="Photo URL"
              className="input"
            />
          ) : null}
          {uploadError ? (
            <p className="text-xs text-[var(--danger)]">{uploadError}</p>
          ) : null}

          {photoUrl ? (
            <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-2)] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
                Fit the photo in the circle
              </p>
              <ImageAdjuster
                src={photoUrl}
                value={framing}
                onChange={setFraming}
                ringColor={theme.secondaryColor}
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
            Details
          </h2>

          <Field
            label="Job title"
            icon={<Briefcase size={14} strokeWidth={1.8} aria-hidden />}
          >
            <input
              {...bind("jobTitle")}
              name="jobTitle"
              className="input"
              placeholder="Founder & Director"
            />
          </Field>

          <Field
            label="Public link"
            icon={<Link2 size={14} strokeWidth={1.8} aria-hidden />}
            hint={
              <span className="mt-1.5 block truncate text-xs text-[var(--app-fg-subtle)]">
                /c/{orgSlug}/{slug || "…"}
              </span>
            }
          >
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="input"
              placeholder="amr-khalil"
            />
          </Field>
        </section>

        <section className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
            Contact
          </h2>
          <Field
            label="Phone"
            icon={<Phone size={14} strokeWidth={1.8} aria-hidden />}
          >
            <input
              {...bind("phone")}
              name="phone"
              type="tel"
              className="input"
              placeholder="+27 11 000 0000"
            />
          </Field>
          <Field
            label="WhatsApp"
            icon={<MessageCircle size={14} strokeWidth={1.8} aria-hidden />}
          >
            <input
              {...bind("whatsapp")}
              name="whatsapp"
              type="tel"
              className="input"
              placeholder="+27 11 000 0000"
            />
          </Field>
          <Field
            label="Email"
            icon={<Mail size={14} strokeWidth={1.8} aria-hidden />}
          >
            <input
              {...bind("email")}
              name="email"
              type="email"
              className="input"
              placeholder="you@example.com"
            />
          </Field>
          <Field
            label="Website"
            icon={<Globe size={14} strokeWidth={1.8} aria-hidden />}
          >
            <input
              {...bind("website")}
              name="website"
              className="input"
              placeholder="https://example.com"
            />
          </Field>
        </section>

        <section className="space-y-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
            Social links
          </h2>
          <Field label="Instagram" icon={<InstagramGlyph size={14} />}>
            <input {...bind("instagram")} name="instagram" className="input" />
          </Field>
          <Field label="LinkedIn" icon={<LinkedinGlyph size={14} />}>
            <input {...bind("linkedin")} name="linkedin" className="input" />
          </Field>
          <Field label="X" icon={<XGlyph size={14} />}>
            <input {...bind("twitter")} name="twitter" className="input" />
          </Field>
          <Field label="Facebook" icon={<FacebookGlyph size={14} />}>
            <input {...bind("facebook")} name="facebook" className="input" />
          </Field>
        </section>

        <button type="submit" className="btn-primary w-full sm:w-auto">
          Save card
        </button>
      </form>

      <div className="lg:sticky lg:top-24">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
          Live preview
        </p>
        <BrandCard data={preview} size="sm" />
      </div>
    </div>
  );
}
