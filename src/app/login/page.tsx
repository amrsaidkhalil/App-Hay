import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { getCurrentUser, devAuthAvailable } from "@/lib/dev-session";
import { signIn, isGoogleAuthConfigured } from "@/auth";
import { devLoginAction } from "./actions";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{
              background:
                "radial-gradient(80% 70% at 80% 5%, #2b3a5c 0%, transparent 60%), linear-gradient(160deg, #16233c 0%, #080d18 100%)",
            }}
            aria-hidden
          >
            <CreditCard size={26} strokeWidth={1.7} />
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Digital Cards
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--app-fg-muted)]">
            Your business card, lead scanner and contacts — in one place.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {isGoogleAuthConfigured ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button type="submit" className="btn-primary w-full">
                Continue with Google
              </button>
            </form>
          ) : null}

          {devAuthAvailable ? (
            <form action={devLoginAction}>
              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-dashed border-amber-400/50 bg-amber-400/[0.07] px-4 text-[15px] font-medium text-amber-200 transition-colors duration-200 hover:bg-amber-400/[0.12]"
              >
                Continue as dev user (local only)
              </button>
            </form>
          ) : null}

          {!isGoogleAuthConfigured && !devAuthAvailable ? (
            <p
              role="alert"
              className="rounded-xl bg-red-400/12 px-4 py-3 text-sm text-red-300"
            >
              No sign-in method is configured. Set AUTH_GOOGLE_ID and
              AUTH_GOOGLE_SECRET.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
