"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function updateAccountAction(formData: FormData) {
  const user = await requireUser();

  // `email` is deliberately not accepted here — it's the login identity tied
  // to the auth provider, and editing it would break sign-in.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: String(formData.get("name") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      workEmail: String(formData.get("workEmail") ?? "").trim() || null,
    },
  });

  redirect("/dashboard/account?saved=1");
}
