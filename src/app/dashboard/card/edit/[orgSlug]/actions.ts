"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { uploadImage } from "@/lib/upload";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Only allow http(s) URLs — blocks javascript:/data: reaching an <img src>. */
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

async function requireMembership(orgSlug: string) {
  const user = await requireUser();
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug: orgSlug } },
    include: { org: true },
  });
  if (!membership) throw new Error("Not a member of this organization");
  return { user, membership };
}

export async function saveCardAction(formData: FormData) {
  const orgSlug = String(formData.get("orgSlug"));
  const { user, membership } = await requireMembership(orgSlug);

  const rawSlug = String(formData.get("slug") ?? "");
  const slug = slugify(rawSlug || user.name || user.email);

  const socialLinks = JSON.stringify({
    instagram: String(formData.get("instagram") ?? "").trim() || undefined,
    linkedin: String(formData.get("linkedin") ?? "").trim() || undefined,
    twitter: String(formData.get("twitter") ?? "").trim() || undefined,
    facebook: String(formData.get("facebook") ?? "").trim() || undefined,
  });

  const fields = {
    slug,
    jobTitle: String(formData.get("jobTitle") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    whatsapp: String(formData.get("whatsapp") ?? "") || null,
    email: String(formData.get("email") ?? "") || null,
    website: String(formData.get("website") ?? "") || null,
    photoUrl: safeUrl(formData.get("photoUrl")),
    socialLinks,
  };

  await prisma.card.upsert({
    where: {
      orgId_ownerUserId: { orgId: membership.orgId, ownerUserId: user.id },
    },
    update: fields,
    create: { ...fields, orgId: membership.orgId, ownerUserId: user.id },
  });

  redirect(`/dashboard/card/edit/${orgSlug}?saved=1`);
}

export async function uploadCardPhotoAction(formData: FormData) {
  const orgSlug = String(formData.get("orgSlug"));
  const { user } = await requireMembership(orgSlug);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false as const, error: "No file selected." };
  }
  return uploadImage(file, `card/${user.id}/photo`);
}
