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

/** Persists a drag-reordered brand list — index in the array becomes rank. */
export async function reorderBrandsAction(orgIds: string[]) {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id, orgId: { in: orgIds } },
    select: { id: true, orgId: true },
  });
  const membershipByOrgId = new Map(memberships.map((m) => [m.orgId, m.id]));

  await prisma.$transaction(
    orgIds
      .map((orgId, index) => {
        const membershipId = membershipByOrgId.get(orgId);
        if (!membershipId) return null;
        return prisma.membership.update({
          where: { id: membershipId },
          data: { order: index },
        });
      })
      .filter((update) => update !== null)
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

/**
 * Deletes an entire brand — its card, branding, and every contact captured
 * under it (cascade in the schema). Restricted to the owner, since an admin
 * managing branding shouldn't be able to erase the brand outright.
 */
export async function deleteBrandAction(formData: FormData) {
  const user = await requireUser();
  const orgId = String(formData.get("orgId") ?? "");

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
  });
  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only the owner can delete a brand");
  }

  await prisma.organization.delete({ where: { id: orgId } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}
