import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { isGoogleAuthConfigured } from "@/auth";
import { updateAccountAction } from "./actions";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sessionUser = await requireUser();
  const { saved } = await searchParams;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-[var(--app-fg)]"
        >
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          Settings
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
          Account details
        </h1>
      </div>

      {saved ? (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          <Check size={16} strokeWidth={2.2} aria-hidden />
          Saved.
        </p>
      ) : null}

      <form action={updateAccountAction} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Full name
          </span>
          <input
            name="name"
            defaultValue={user.name ?? ""}
            maxLength={100}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            maxLength={40}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Work email
          </span>
          <input
            name="workEmail"
            type="email"
            defaultValue={user.workEmail ?? ""}
            maxLength={200}
            className="input"
          />
        </label>

        <div>
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Login method
          </span>
          <div className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-2)] px-4 text-[15px] text-[var(--app-fg-muted)]">
            <ShieldCheck size={17} strokeWidth={1.8} aria-hidden />
            <span className="min-w-0 flex-1 truncate">
              {isGoogleAuthConfigured ? "Google" : "Dev sign-in"} · {user.email}
            </span>
          </div>
          <p className="mt-2 px-1 text-xs leading-relaxed text-[var(--app-fg-subtle)]">
            Your sign-in email can&apos;t be changed here — it&apos;s how your
            account is identified. Use the work email above for the address you
            want people to reach you on.
          </p>
        </div>

        <button type="submit" className="btn-primary w-full">
          Save changes
        </button>
      </form>
    </div>
  );
}
