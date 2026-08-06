"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function saveOrgSettingsAction(formData: FormData) {
  const user = await requireUser();
  const slug = String(formData.get("slug"));

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug } },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw new Error("Not authorized to edit this organization");
  }

  await prisma.organization.update({
    where: { slug },
    data: {
      name: String(formData.get("name") ?? "").trim() || undefined,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      primaryColor: String(formData.get("primaryColor") ?? "#111827"),
      secondaryColor: String(formData.get("secondaryColor") ?? "#34d399"),
      headingFont: String(formData.get("headingFont") ?? "Poppins"),
    },
  });

  redirect(`/dashboard/org/${slug}/settings?saved=1`);
}
