"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function saveCardAction(formData: FormData) {
  const user = await requireUser();
  const orgSlug = String(formData.get("orgSlug"));

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug: orgSlug } },
    include: { org: true },
  });
  if (!membership) throw new Error("Not a member of this organization");

  const rawSlug = String(formData.get("slug") ?? "");
  const slug = slugify(rawSlug || user.name || user.email);

  const socialLinks = JSON.stringify({
    instagram: String(formData.get("instagram") ?? "").trim() || undefined,
    linkedin: String(formData.get("linkedin") ?? "").trim() || undefined,
    twitter: String(formData.get("twitter") ?? "").trim() || undefined,
    facebook: String(formData.get("facebook") ?? "").trim() || undefined,
  });

  await prisma.card.upsert({
    where: {
      orgId_ownerUserId: { orgId: membership.orgId, ownerUserId: user.id },
    },
    update: {
      slug,
      jobTitle: String(formData.get("jobTitle") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      whatsapp: String(formData.get("whatsapp") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      website: String(formData.get("website") ?? "") || null,
      socialLinks,
    },
    create: {
      orgId: membership.orgId,
      ownerUserId: user.id,
      slug,
      jobTitle: String(formData.get("jobTitle") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      whatsapp: String(formData.get("whatsapp") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      website: String(formData.get("website") ?? "") || null,
      socialLinks,
    },
  });

  redirect(`/dashboard/card/edit/${orgSlug}?saved=1`);
}
