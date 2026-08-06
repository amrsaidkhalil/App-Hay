"use client";

import { useState } from "react";
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
    const formData = new FormData();
    formData.append("image", file);
    const result = await scanCardAction(formData);
    setScanning(false);
    if (result.ok) {
      setFields(result.data);
    } else {
      setError(result.error);
    }
  }

  async function onSave() {
    if (!fields) return;
    setSaving(true);
    setError(null);
    const formData = new FormData();
    formData.append("orgSlug", orgSlug);
    formData.append("name", fields.name);
    formData.append("jobTitle", fields.jobTitle);
    formData.append("company", fields.company);
    formData.append("phone", fields.phone);
    formData.append("email", fields.email);
    const result = await saveScannedContactAction(formData);
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      setFields(null);
      setFile(null);
      setPreviewUrl(null);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="space-y-3">
        <label className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 transition hover:border-slate-400">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={onFileChange}
          />
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selected card" className="mx-auto max-h-48 rounded-lg" />
          ) : (
            "Take a photo or upload a business card image"
          )}
        </label>

        <button
          type="button"
          disabled={!file || scanning}
          onClick={onScan}
          className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          {scanning ? "Scanning…" : "Scan card"}
        </button>
      </div>

      <div className="space-y-4">
        {saved && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Saved to leads.
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {fields ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Confirm details
            </p>

            {orgs.length > 1 && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
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
                <span className="mb-1 block text-xs font-medium text-slate-600">
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
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save to leads"}
            </button>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400">
            Upload a card photo and scan it — fields will appear here for you
            to confirm before saving.
          </p>
        )}
      </div>
    </div>
  );
}
