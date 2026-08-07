"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/upload";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const FONTS = new Set(["Poppins", "Poetsen One"]);

/**
 * Colors are interpolated into CSS gradients on the card, so they never get
 * stored unvalidated — anything that isn't a plain 6-digit hex falls back.
 */
function safeHex(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  return HEX_RE.test(raw) ? raw.toLowerCase() : fallback;
}

/** Only allow http(s) image URLs — blocks javascript:/data: in an <img src>. */
function safeUrl(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? raw
      : null;
  } catch {
    return null;
  }
}

/** Framing values come from a slider/drag, so clamp rather than trust. */
function safeNumber(
  value: FormDataEntryValue | null,
  fallback: number,
  min: number,
  max: number
) {
  const n = Number(String(value ?? ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function requireOrgAdmin(slug: string) {
  const user = await requireUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug } },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new Error("Not authorized to edit this organization");
  }
  return membership;
}

export async function saveOrgSettingsAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  await requireOrgAdmin(slug);

  const font = String(formData.get("headingFont") ?? "Poppins");

  await prisma.organization.update({
    where: { slug },
    data: {
      name: String(formData.get("name") ?? "").trim() || undefined,
      logoUrl: safeUrl(formData.get("logoUrl")),
      logoScale: safeNumber(formData.get("logoScale"), 1, 0.4, 3),
      logoOffsetX: safeNumber(formData.get("logoOffsetX"), 0, -100, 100),
      logoOffsetY: safeNumber(formData.get("logoOffsetY"), 0, -100, 100),
      primaryColor: safeHex(formData.get("primaryColor"), "#111827"),
      textColor: safeHex(formData.get("textColor"), "#ffffff"),
      secondaryColor: safeHex(formData.get("secondaryColor"), "#34d399"),
      headingFont: FONTS.has(font) ? font : "Poppins",
    },
  });

  redirect(`/dashboard/org/${slug}/settings?saved=1`);
}

export async function uploadOrgLogoAction(formData: FormData) {
  const slug = String(formData.get("orgSlug"));
  await requireOrgAdmin(slug);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: "No file selected." };
  }
  return uploadImage(file, `org/${slug}/logo`);
}
