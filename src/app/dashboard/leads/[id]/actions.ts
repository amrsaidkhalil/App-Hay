"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

/** Contacts are scoped to orgs the user belongs to, not just the ones they scanned — anyone on the brand can manage a shared lead list. */
async function requireContactAccess(contactId: string) {
  const user = await requireUser();
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { orgId: true },
  });
  const orgIds = memberships.map((m) => m.orgId);

  const contact = await prisma.scannedContact.findFirst({
    where: { id: contactId, orgId: { in: orgIds } },
  });
  if (!contact) throw new Error("Contact not found");
  return contact;
}

export async function updateContactAction(formData: FormData) {
  const id = String(formData.get("id"));
  await requireContactAccess(id);

  await prisma.scannedContact.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim() || null,
      jobTitle: String(formData.get("jobTitle") ?? "").trim() || null,
      company: String(formData.get("company") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
    },
  });

  redirect(`/dashboard/leads/${id}?saved=1`);
}

export async function deleteContactAction(formData: FormData) {
  const id = String(formData.get("id"));
  await requireContactAccess(id);

  await prisma.scannedContact.delete({ where: { id } });

  redirect("/dashboard/leads");
}
