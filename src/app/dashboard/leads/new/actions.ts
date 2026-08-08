"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function createContactAction(formData: FormData) {
  const user = await requireUser();
  const orgSlug = String(formData.get("orgSlug") ?? "");

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug: orgSlug } },
  });
  if (!membership) throw new Error("Not a member of this organization");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard/leads/new?error=name");

  await prisma.scannedContact.create({
    data: {
      orgId: membership.orgId,
      scannedByUserId: user.id,
      name,
      jobTitle: String(formData.get("jobTitle") ?? "").trim() || null,
      company: String(formData.get("company") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      source: "MANUAL",
    },
  });

  redirect("/dashboard/leads");
}
