import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dev-session";

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
