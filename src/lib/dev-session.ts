import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth, isGoogleAuthConfigured } from "@/auth";

const DEV_SESSION_COOKIE = "dc_dev_session";

// Phase 1 login: a plain httpOnly cookie holding a userId, no password/OAuth
// involved. This exists so the app is fully testable before the user sets up
// a Google OAuth client. Once AUTH_GOOGLE_ID/SECRET are configured, real
// Auth.js sessions (see src/auth.ts) should be used instead — this bypass
// intentionally refuses to run outside development.
export const devAuthAvailable =
  process.env.NODE_ENV !== "production" && !isGoogleAuthConfigured;

export async function getCurrentUser() {
  if (devAuthAvailable) {
    const cookieStore = await cookies();
    const userId = cookieStore.get(DEV_SESSION_COOKIE)?.value;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) return user;
    }
  }

  if (!isGoogleAuthConfigured) return null;
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function devSignIn(userId: string) {
  if (!devAuthAvailable) throw new Error("Dev sign-in is disabled");
  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function devSignOut() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_SESSION_COOKIE);
}
