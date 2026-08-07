"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

const RESERVED = new Set(["new", "settings", "api", "c", "dashboard", "login"]);

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function createOrgAction(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard/org/new?error=name");

  const base = slugify(name);
  if (!base || RESERVED.has(base)) {
    redirect("/dashboard/org/new?error=reserved");
  }

  // Slugs are globally unique and become public URLs, so suffix on collision
  // rather than failing in the user's face.
  let slug = base;
  for (let i = 2; i < 60; i += 1) {
    const taken = await prisma.organization.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${base}-${i}`;
  }

  await prisma.organization.create({
    data: {
      slug,
      name,
      primaryColor: "#0f172a",
      textColor: "#ffffff",
      secondaryColor: "#38bdf8",
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  redirect(`/dashboard/org/${slug}/settings?created=1`);
}
