"use server";

import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { scanBusinessCard, type ScannedFields } from "@/lib/scan-card";

export async function scanCardAction(
  formData: FormData
): Promise<{ ok: true; data: ScannedFields } | { ok: false; error: string }> {
  await requireUser();

  const file = formData.get("image");
  if (!(file instanceof File)) return { ok: false, error: "No image provided" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const data = await scanBusinessCard(base64, file.type || "image/jpeg");
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Scan failed",
    };
  }
}

export async function saveScannedContactAction(
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  const orgSlug = String(formData.get("orgSlug"));

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug: orgSlug } },
  });
  if (!membership) return { ok: false, error: "Not a member of this organization" };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required" };

  await prisma.scannedContact.create({
    data: {
      orgId: membership.orgId,
      scannedByUserId: user.id,
      name,
      jobTitle: String(formData.get("jobTitle") ?? "") || null,
      company: String(formData.get("company") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      source: "AI_SCAN",
    },
  });

  return { ok: true };
}
