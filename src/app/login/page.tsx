import { redirect } from "next/navigation";
import { getCurrentUser, devAuthAvailable } from "@/lib/dev-session";
import { signIn, isGoogleAuthConfigured } from "@/auth";
import { devLoginAction } from "./actions";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Digital Cards
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to manage your card and leads.
        </p>

        <div className="mt-8 space-y-3">
          {isGoogleAuthConfigured ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Continue with Google
              </button>
            </form>
          ) : null}

          {devAuthAvailable ? (
            <form action={devLoginAction}>
              <button
                type="submit"
                className="w-full rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
              >
                Continue as dev user (local only)
              </button>
            </form>
          ) : null}

          {!isGoogleAuthConfigured && !devAuthAvailable ? (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
              No sign-in method is configured. Set AUTH_GOOGLE_ID /
              AUTH_GOOGLE_SECRET in .env.local.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
