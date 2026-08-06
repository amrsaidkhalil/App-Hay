import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// Google sign-in is Phase 2: it activates automatically once
// AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are set (see README "Post-build
// checklist"). The PrismaAdapter also needs Account/Session/VerificationToken
// models added via `prisma migrate` at that point — see the same checklist.
const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: googleConfigured
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
});

export const isGoogleAuthConfigured = googleConfigured;
