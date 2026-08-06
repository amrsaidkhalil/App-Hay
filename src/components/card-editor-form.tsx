"use client";

import { useState } from "react";
import { CardPreview, type CardPreviewData, type OrgTheme } from "./card-preview";

type FieldKey = keyof CardPreviewData;

export function CardEditorForm({
  orgSlug,
  orgName,
  cardSlug,
  theme,
  initial,
  saveAction,
}: {
  orgSlug: string;
  orgName: string;
  cardSlug: string;
  theme: OrgTheme;
  initial: Omit<CardPreviewData, "orgName">;
  saveAction: (formData: FormData) => void;
}) {
  const [data, setData] = useState<CardPreviewData>({ ...initial, orgName });
  const [slug, setSlug] = useState(cardSlug);

  function update(key: FieldKey) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setData((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="orgSlug" value={orgSlug} />

        <Field label="Public URL slug">
          <input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="input"
            placeholder="amr-khalil"
          />
          <span className="mt-1 block text-xs text-slate-400">
            /c/{orgSlug}/{slug || "…"}
          </span>
        </Field>
        <Field label="Job title">
          <input
            name="jobTitle"
            defaultValue={initial.jobTitle}
            onChange={update("jobTitle")}
            className="input"
            placeholder="Founder & Director"
          />
        </Field>
        <Field label="Phone">
          <input
            name="phone"
            defaultValue={initial.phone}
            onChange={update("phone")}
            className="input"
            placeholder="+27 11 000 0000"
          />
        </Field>
        <Field label="WhatsApp">
          <input
            name="whatsapp"
            defaultValue={initial.whatsapp}
            onChange={update("whatsapp")}
            className="input"
            placeholder="+27 11 000 0000"
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={initial.email}
            onChange={update("email")}
            className="input"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Website">
          <input
            name="website"
            defaultValue={initial.website}
            onChange={update("website")}
            className="input"
            placeholder="https://example.com"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram">
            <input
              name="instagram"
              defaultValue={initial.instagram}
              onChange={update("instagram")}
              className="input"
            />
          </Field>
          <Field label="LinkedIn">
            <input
              name="linkedin"
              defaultValue={initial.linkedin}
              onChange={update("linkedin")}
              className="input"
            />
          </Field>
          <Field label="X / Twitter">
            <input
              name="twitter"
              defaultValue={initial.twitter}
              onChange={update("twitter")}
              className="input"
            />
          </Field>
          <Field label="Facebook">
            <input
              name="facebook"
              defaultValue={initial.facebook}
              onChange={update("facebook")}
              className="input"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Save card
        </button>
      </form>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Live preview
        </p>
        <CardPreview data={data} theme={theme} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
