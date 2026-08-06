"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { devSignIn, devAuthAvailable } from "@/lib/dev-session";

export async function devLoginAction() {
  if (!devAuthAvailable) throw new Error("Dev sign-in is disabled");
  const user = await prisma.user.findFirstOrThrow();
  await devSignIn(user.id);
  redirect("/dashboard");
}
