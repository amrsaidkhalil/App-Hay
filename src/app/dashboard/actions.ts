"use server";

import { redirect } from "next/navigation";
import { devSignOut } from "@/lib/dev-session";

export async function signOutAction() {
  await devSignOut();
  redirect("/login");
}
