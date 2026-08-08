import Link from "next/link";
import {
  Download,
  ScanLine,
  UserPlus,
  UserPlus2,
  Users,
  ChevronRight,
} from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

const SOURCE_META: Record<
  string,
  { label: string; Icon: typeof ScanLine }
> = {
  AI_SCAN: { label: "Scanned", Icon: ScanLine },
  CARD_INBOUND: { label: "Shared with you", Icon: UserPlus },
  MANUAL: { label: "Added manually", Icon: UserPlus2 },
};

export default async function LeadsPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { orgId: true },
  });
  const orgIds = memberships.map((m) => m.orgId);

  const contacts = await prisma.scannedContact.findMany({
    where: { orgId: { in: orgIds } },
    include: { org: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
            Contacts
          </h1>
          <p className="mt-1 text-sm text-[var(--app-fg-muted)]">
            {contacts.length === 0
              ? "Everyone you capture will land here."
              : `${contacts.length} contact${contacts.length === 1 ? "" : "s"} collected.`}
          </p>
        </div>
        {contacts.length > 0 ? (
          <Link href="/dashboard/leads/export" className="btn-ghost text-sm">
            <Download size={16} strokeWidth={1.8} aria-hidden />
            Export CSV
          </Link>
        ) : null}
      </div>

      <Link href="/dashboard/leads/new" className="btn-primary w-full">
        <UserPlus2 size={18} strokeWidth={1.9} aria-hidden />
        Add New Contact
      </Link>

      {contacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--app-border-strong)] px-6 py-14 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-overlay)] text-[var(--app-fg-subtle)]"
            aria-hidden
          >
            <Users size={24} strokeWidth={1.6} />
          </span>
          <p className="mt-4 text-[15px] font-medium text-[var(--app-fg)]">
            No contacts yet
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-[var(--app-fg-muted)]">
            Scan a business card, or share your card so people can send their
            details back.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          {contacts.map((c) => {
            const meta = SOURCE_META[c.source] ?? {
              label: c.source,
              Icon: Users,
            };
            const { Icon } = meta;
            return (
              <li key={c.id}>
                <Link
                  href={`/dashboard/leads/${c.id}`}
                  className="flex min-h-[64px] items-start gap-3.5 px-4 py-4 transition-colors duration-200 hover:bg-[var(--app-overlay)] active:bg-[var(--app-overlay-strong)]"
                >
                  <span
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-overlay-strong)] text-[var(--app-fg-muted)]"
                    aria-hidden
                  >
                    <Icon size={17} strokeWidth={1.8} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-[var(--app-fg)]">
                      {c.name ?? "Unnamed contact"}
                    </p>
                    {c.jobTitle || c.company ? (
                      <p className="truncate text-[13px] text-[var(--app-fg-muted)]">
                        {[c.jobTitle, c.company].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}

                    <div className="mt-1.5 space-y-0.5">
                      {c.email ? (
                        <p className="truncate text-[13px] text-[var(--app-fg-muted)]">
                          {c.email}
                        </p>
                      ) : null}
                      {c.phone ? (
                        <p className="truncate text-[13px] text-[var(--app-fg-muted)]">
                          {c.phone}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[var(--app-overlay-strong)] px-2 py-0.5 text-[11px] text-[var(--app-fg-subtle)]">
                        {meta.label}
                      </span>
                      <span className="rounded-full bg-[var(--app-overlay-strong)] px-2 py-0.5 text-[11px] text-[var(--app-fg-subtle)]">
                        {c.org.name}
                      </span>
                      <span className="text-[11px] text-[var(--app-fg-subtle)]">
                        {c.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={18}
                    strokeWidth={1.8}
                    className="mt-1.5 shrink-0 text-[var(--app-fg-subtle)]"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
