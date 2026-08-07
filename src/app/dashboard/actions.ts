"use server";

import { redirect } from "next/navigation";
import { devSignOut } from "@/lib/dev-session";
import { signOut, isGoogleAuthConfigured } from "@/auth";

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
