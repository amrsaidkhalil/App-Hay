import Link from "next/link";
import { ArrowLeft, UserPlus2 } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { createContactAction } from "./actions";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: [{ order: "asc" }, { org: { name: "asc" } }],
  });

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <Link
          href="/dashboard/leads"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-[var(--app-fg)]"
        >
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          Contacts
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
          New contact
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-[var(--app-fg-muted)]">
          Add someone&apos;s details by hand instead of scanning a card.
        </p>
      </div>

      {error === "name" ? (
        <p
          role="alert"
          className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800"
        >
          Give the contact a name.
        </p>
      ) : null}

      {memberships.length === 0 ? (
        <p className="text-sm text-[var(--app-fg-muted)]">
          You need a brand before you can save contacts. Create one first.
        </p>
      ) : (
        <form action={createContactAction} className="space-y-4">
          {memberships.length > 1 ? (
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
                Brand
              </span>
              <select name="orgSlug" className="input" defaultValue={memberships[0].org.slug}>
                {memberships.map(({ org }) => (
                  <option key={org.id} value={org.slug}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="orgSlug" value={memberships[0].org.slug} />
          )}

          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
              Full name
            </span>
            <input name="name" required autoFocus maxLength={100} className="input" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
              Job title
            </span>
            <input name="jobTitle" maxLength={100} className="input" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
              Company
            </span>
            <input name="company" maxLength={100} className="input" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
              Email
            </span>
            <input name="email" type="email" maxLength={200} className="input" />
          </label>

          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
              Phone
            </span>
            <input name="phone" type="tel" maxLength={40} className="input" />
          </label>

          <button type="submit" className="btn-primary w-full">
            <UserPlus2 size={18} strokeWidth={1.9} aria-hidden />
            Add contact
          </button>
        </form>
      )}
    </div>
  );
}
