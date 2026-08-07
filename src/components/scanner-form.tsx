"use client";

import { useState } from "react";
import {
  Camera,
  ScanLine,
  Loader2,
  Check,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import type { ScannedFields } from "@/lib/scan-card";
import { scanCardAction, saveScannedContactAction } from "@/app/dashboard/scanner/actions";

export function ScannerForm({
  orgs,
}: {
  orgs: { slug: string; name: string }[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<ScannedFields | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [orgSlug, setOrgSlug] = useState(orgs[0]?.slug ?? "");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFields(null);
    setError(null);
    setSaved(false);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function onScan() {
    if (!file) return;
    setScanning(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const result = await scanCardAction(formData);
      if (result.ok) {
        setFields(result.data);
      } else {
        setError(result.error);
      }
    } catch {
      setError(
        "Scan failed — the photo may be too large. Try a closer, lower-resolution shot."
      );
    } finally {
      setScanning(false);
    }
  }

  async function onSave() {
    if (!fields) return;
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("orgSlug", orgSlug);
      formData.append("name", fields.name);
      formData.append("jobTitle", fields.jobTitle);
      formData.append("company", fields.company);
      formData.append("phone", fields.phone);
      formData.append("email", fields.email);
      const result = await saveScannedContactAction(formData);
      if (result.ok) {
        setSaved(true);
        setFields(null);
        setFile(null);
        setPreviewUrl(null);
      } else {
        setError(result.error);
      }
    } catch {
      setError("Save failed — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
      <div className="space-y-3">
        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--app-border-strong)] bg-[var(--app-surface)] p-5 text-center transition-colors duration-200 hover:bg-[var(--app-overlay)]">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Selected business card"
              className="max-h-48 rounded-xl"
            />
          ) : (
            <>
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-overlay-strong)] text-[var(--app-fg-muted)]"
                aria-hidden
              >
                <Camera size={24} strokeWidth={1.6} />
              </span>
              <span className="text-sm text-[var(--app-fg-muted)]">
                Take a photo or choose an image
              </span>
            </>
          )}
        </label>

        <button
          type="button"
          disabled={!file || scanning}
          onClick={onScan}
          className="btn-primary w-full"
        >
          {scanning ? (
            <>
              <Loader2 size={17} className="animate-spin" aria-hidden />
              Scanning…
            </>
          ) : (
            <>
              <ScanLine size={17} strokeWidth={1.9} aria-hidden />
              Scan card
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {saved && (
          <p className="flex items-center gap-2 rounded-xl bg-emerald-400/12 px-4 py-3 text-sm text-emerald-700">
            <Check size={16} strokeWidth={2.2} aria-hidden />
            Saved to contacts.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-400/12 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle size={16} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        {fields ? (
          <div className="space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
              Confirm details
            </p>

            {orgs.length > 1 && (
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
                  Save to
                </span>
                <select
                  className="input"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                >
                  {orgs.map((org) => (
                    <option key={org.slug} value={org.slug}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {(
              [
                ["name", "Name"],
                ["jobTitle", "Job title"],
                ["company", "Company"],
                ["phone", "Phone"],
                ["email", "Email"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
                  {label}
                </span>
                <input
                  className="input"
                  value={fields[key]}
                  onChange={(e) =>
                    setFields((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))
                  }
                />
              </label>
            ))}

            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="btn-primary w-full"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <UserPlus size={17} strokeWidth={1.9} aria-hidden />
                  Save to contacts
                </>
              )}
            </button>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--app-border)] p-6 text-sm leading-relaxed text-[var(--app-fg-subtle)]">
            Scan a photo and the details appear here for you to check before
            saving.
          </p>
        )}
      </div>
    </div>
  );
}
