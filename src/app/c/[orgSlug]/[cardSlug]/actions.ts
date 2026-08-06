"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function shareContactBackAction(formData: FormData) {
  const cardId = String(formData.get("cardId"));
  const orgSlug = String(formData.get("orgSlug"));
  const cardSlug = String(formData.get("cardSlug"));

  const card = await prisma.card.findUniqueOrThrow({ where: { id: cardId } });

  const name = String(formData.get("name") ?? "").trim();
  if (name) {
    await prisma.scannedContact.create({
      data: {
        orgId: card.orgId,
        scannedByUserId: card.ownerUserId,
        name,
        company: String(formData.get("company") ?? "") || null,
        email: String(formData.get("email") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        source: "CARD_INBOUND",
      },
    });
  }

  redirect(`/c/${orgSlug}/${cardSlug}?shared=1`);
}
