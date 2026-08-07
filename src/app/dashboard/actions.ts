"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { devSignOut } from "@/lib/dev-session";
import { signOut, isGoogleAuthConfigured } from "@/auth";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export async function signOutAction() {
  // Clear the dev cookie either way, then end the real Auth.js session when
  // Google is configured — otherwise the database session survives and the
  // user is silently signed straight back in.
  await devSignOut();

  if (isGoogleAuthConfigured) {
    // signOut() issues its own redirect, so nothing after this runs.
    await signOut({ redirectTo: "/login" });
  }

  redirect("/login");
}

/** Moves one brand to the front of the card list and settings list. */
export async function setPrimaryBrandAction(formData: FormData) {
  const user = await requireUser();
  const orgId = String(formData.get("orgId") ?? "");

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
  });
  if (!membership) throw new Error("Not a member of this organization");

  await prisma.$transaction([
    prisma.membership.updateMany({
      where: { userId: user.id, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.membership.update({
      where: { id: membership.id },
      data: { isPrimary: true },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
