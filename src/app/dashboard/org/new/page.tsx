import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { createOrgAction } from "./actions";

export default async function NewOrgPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser();
  const { error } = await searchParams;

  const message =
    error === "reserved"
      ? "Pick a different name — that one is reserved."
      : error === "name"
        ? "Give your brand a name."
        : null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-[var(--app-fg)]"
        >
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          My cards
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
          New brand
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-[var(--app-fg-muted)]">
          Each brand gets its own colors, logo and cards. You can change
          everything afterwards.
        </p>
      </div>

      {message ? (
        <p
          role="alert"
          className="rounded-xl bg-amber-400/12 px-4 py-3 text-sm text-amber-800"
        >
          {message}
        </p>
      ) : null}

      <form action={createOrgAction} className="space-y-4">
        <label className="block">
          <span className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[var(--app-fg-muted)]">
            <Building2 size={14} strokeWidth={1.8} aria-hidden />
            Brand name
          </span>
          <input
            name="name"
            required
            autoFocus
            maxLength={60}
            placeholder="Acme Media"
            className="input"
          />
        </label>

        <button type="submit" className="btn-primary w-full">
          Create brand
        </button>
      </form>
    </div>
  );
}
