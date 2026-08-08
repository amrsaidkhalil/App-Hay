import Link from "next/link";
import QRCode from "qrcode";
import {
  ChevronRight,
  LogOut,
  Download,
  ScanLine,
  Wallet,
  Plus,
  UserCog,
} from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";
import { buildCardTheme } from "@/lib/brand";
import { scannerConfigured } from "@/lib/scan-card";
import { appleWalletConfigured } from "@/lib/wallet/apple";
import { googleWalletConfigured } from "@/lib/wallet/google";
import { BrandOrderList } from "@/components/brand-order-list";
import { QrActions } from "@/components/qr-actions";
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
      className="flex min-h-[56px] items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-[var(--app-overlay)] active:bg-[var(--app-overlay-strong)]"
    >
      <span className="text-[var(--app-fg-muted)]" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 text-[15px] text-[var(--app-fg)]">{label}</span>
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
    orderBy: [{ order: "asc" }, { org: { name: "asc" } }],
  });

  const manageable = memberships.filter(
    (m) => m.role === "OWNER" || m.role === "ADMIN"
  );

  // QR shortcuts act on the card the user put first in their own ordering,
  // which is the one they hand out most.
  const cards = await prisma.card.findMany({ where: { ownerUserId: user.id } });
  const primary = memberships.find((m) => cards.some((c) => c.orgId === m.orgId));
  const primaryCard = primary
    ? cards.find((c) => c.orgId === primary.orgId)
    : undefined;

  let primaryQr: string | null = null;
  if (primary && primaryCard) {
    const baseUrl = await getBaseUrl();
    const theme = buildCardTheme(
      primary.org.primaryColor,
      primary.org.textColor,
      primary.org.secondaryColor,
      primary.org.headingFont
    );
    primaryQr = await QRCode.toDataURL(
      `${baseUrl}/c/${primary.org.slug}/${primaryCard.slug}`,
      { margin: 2, width: 720, color: { dark: theme.qrDark, light: theme.qrLight } }
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
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
        {manageable.length === 0 ? (
          <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-6">
            <p className="text-sm text-[var(--app-fg-muted)]">
              You don&apos;t manage any brands yet.
            </p>
          </div>
        ) : (
          <BrandOrderList
            brands={manageable.map(({ org, role }) => ({
              orgId: org.id,
              orgSlug: org.slug,
              name: org.name,
              role,
              primaryColor: org.primaryColor,
              secondaryColor: org.secondaryColor,
              canDelete: role === "OWNER",
            }))}
          />
        )}
        <div className="mt-2.5 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <Row
            href="/dashboard/org/new"
            icon={<Plus size={20} strokeWidth={1.9} />}
            label="New brand"
          />
        </div>
        {manageable.length > 1 ? (
          <p className="px-1 pt-2 text-xs leading-relaxed text-[var(--app-fg-subtle)]">
            Long-press and drag a brand to reorder it. Swipe left to delete.
          </p>
        ) : null}
      </section>

      {primaryQr && primary ? (
        <section>
          <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
            My QR code
          </h2>
          <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
            <QrActions qrDataUrl={primaryQr} fileLabel={primary.org.name} />
          </div>
          <p className="px-1 pt-2 text-xs leading-relaxed text-[var(--app-fg-subtle)]">
            Uses your {primary.org.name} card — the first one in your list.
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
          Account
        </h2>
        <div className="divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <Row
            href="/dashboard/account"
            icon={<UserCog size={20} strokeWidth={1.8} />}
            label="My account"
          />
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
            <span className="flex-1 text-[15px] text-[var(--app-fg)]">
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
            <span className="flex-1 text-[15px] text-[var(--app-fg)]">Google Wallet</span>
            <StatusPill on={googleWalletConfigured} />
          </div>
          <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
            <Wallet
              size={20}
              strokeWidth={1.8}
              className="text-[var(--app-fg-muted)]"
              aria-hidden
            />
            <span className="flex-1 text-[15px] text-[var(--app-fg)]">Apple Wallet</span>
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
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--app-border-strong)] text-[15px] font-medium text-[var(--danger)] transition-colors duration-200 hover:bg-[var(--app-overlay)]"
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
          ? "bg-emerald-500/10 text-emerald-700"
          : "bg-[var(--app-overlay-strong)] text-[var(--app-fg-subtle)]"
      }`}
    >
      {on ? "Active" : "Not set up"}
    </span>
  );
}
