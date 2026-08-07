import Link from "next/link";
import {
  ChevronRight,
  LogOut,
  Download,
  ScanLine,
  Wallet,
} from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { scannerConfigured } from "@/lib/scan-card";
import { appleWalletConfigured } from "@/lib/wallet/apple";
import { googleWalletConfigured } from "@/lib/wallet/google";
import { signOutAction } from "../actions";

function Row({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-white/[0.04] active:bg-white/[0.07]"
    >
      <span className="text-[var(--app-fg-muted)]" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 text-[15px] text-white">{label}</span>
      {hint ? (
        <span className="text-xs text-[var(--app-fg-subtle)]">{hint}</span>
      ) : null}
      <ChevronRight
        size={18}
        strokeWidth={1.8}
        className="text-[var(--app-fg-subtle)]"
        aria-hidden
      />
    </Link>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: { org: { name: "asc" } },
  });

  const manageable = memberships.filter(
    (m) => m.role === "OWNER" || m.role === "ADMIN"
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--app-fg-muted)]">
          {user.name ?? user.email}
        </p>
      </header>

      <section>
        <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
          Brand settings
        </h2>
        <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          {manageable.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--app-fg-muted)]">
              You don&apos;t manage any organization branding yet.
            </p>
          ) : (
            manageable.map(({ org, role }) => (
              <Row
                key={org.id}
                href={`/dashboard/org/${org.slug}/settings`}
                icon={
                  <span
                    className="block h-5 w-5 rounded-md ring-1 ring-white/15"
                    style={{
                      background: `linear-gradient(135deg, ${org.primaryColor}, ${org.secondaryColor})`,
                    }}
                  />
                }
                label={org.name}
                hint={role}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
          Data
        </h2>
        <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <Row
            href="/dashboard/leads/export"
            icon={<Download size={20} strokeWidth={1.8} />}
            label="Export contacts as CSV"
          />
        </div>
      </section>

      <section>
        <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
          Integrations
        </h2>
        <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
            <ScanLine
              size={20}
              strokeWidth={1.8}
              className="text-[var(--app-fg-muted)]"
              aria-hidden
            />
            <span className="flex-1 text-[15px] text-white">
              AI Contact Scanner
            </span>
            <StatusPill on={scannerConfigured} />
          </div>
          <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
            <Wallet
              size={20}
              strokeWidth={1.8}
              className="text-[var(--app-fg-muted)]"
              aria-hidden
            />
            <span className="flex-1 text-[15px] text-white">Google Wallet</span>
            <StatusPill on={googleWalletConfigured} />
          </div>
          <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
            <Wallet
              size={20}
              strokeWidth={1.8}
              className="text-[var(--app-fg-muted)]"
              aria-hidden
            />
            <span className="flex-1 text-[15px] text-white">Apple Wallet</span>
            <StatusPill on={appleWalletConfigured} />
          </div>
        </div>
        <p className="px-1 pt-2 text-xs leading-relaxed text-[var(--app-fg-subtle)]">
          Integrations switch on automatically once their keys are set. See the
          project README for what each one needs.
        </p>
      </section>

      <form action={signOutAction}>
        <button
          type="submit"
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border-strong)] text-[15px] font-medium text-[var(--danger)] transition-colors duration-200 hover:bg-white/[0.04]"
        >
          <LogOut size={18} strokeWidth={1.8} aria-hidden />
          Sign out
        </button>
      </form>
    </div>
  );
}

function StatusPill({ on }: { on: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        on
          ? "bg-emerald-400/15 text-emerald-300"
          : "bg-white/[0.07] text-[var(--app-fg-subtle)]"
      }`}
    >
      {on ? "Active" : "Not set up"}
    </span>
  );
}
