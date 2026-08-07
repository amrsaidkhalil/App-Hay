import { ScanLine } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { scannerConfigured } from "@/lib/scan-card";
import { ScannerForm } from "@/components/scanner-form";

export default async function ScannerPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: { org: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
          Scan a card
        </h1>
        <p className="mt-1 text-sm text-[var(--app-fg-muted)]">
          Photograph a paper business card and it becomes a contact.
        </p>
      </div>

      {!scannerConfigured ? (
        <div className="rounded-2xl border border-dashed border-amber-400/40 bg-amber-400/[0.06] px-6 py-10 text-center">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-700"
            aria-hidden
          >
            <ScanLine size={24} strokeWidth={1.6} />
          </span>
          <p className="mt-4 text-[15px] font-medium text-[var(--app-fg)]">
            Scanner isn&apos;t set up yet
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-[var(--app-fg-muted)]">
            Add an <code className="font-mono text-amber-800">ANTHROPIC_API_KEY</code>{" "}
            to switch this on.
          </p>
        </div>
      ) : memberships.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--app-border-strong)] p-6 text-sm text-[var(--app-fg-muted)]">
          You need to belong to an organization before saving contacts.
        </p>
      ) : (
        <ScannerForm
          orgs={memberships.map((m) => ({ slug: m.org.slug, name: m.org.name }))}
        />
      )}
    </div>
  );
}
