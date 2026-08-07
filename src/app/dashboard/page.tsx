import Link from "next/link";
import QRCode from "qrcode";
import { Plus, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";
import { buildCardTheme } from "@/lib/brand";
import { BrandCard } from "@/components/brand-card";
import { CardActions } from "@/components/card-actions";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: { org: { name: "asc" } },
  });

  const cards = await prisma.card.findMany({
    where: { ownerUserId: user.id },
  });
  const cardByOrgId = new Map(cards.map((card) => [card.orgId, card]));

  const baseUrl = await getBaseUrl();
  const displayName = user.name ?? user.email;

  // Pre-render each card's QR on the server so the grid paints in one pass.
  // Modules use the org's accent, darkened by buildCardTheme until it still scans.
  const qrByCardId = new Map<string, string>(
    await Promise.all(
      cards.map(async (card) => {
        const org = memberships.find((m) => m.orgId === card.orgId)?.org;
        const url = `${baseUrl}/c/${org?.slug ?? ""}/${card.slug}`;
        const theme = buildCardTheme(
          org?.primaryColor ?? "#111827",
          org?.textColor ?? "#ffffff",
          org?.secondaryColor ?? "#34d399",
          org?.headingFont ?? "Poppins"
        );
        const qr = await QRCode.toDataURL(url, {
          margin: 0,
          width: 320,
          color: { dark: theme.qrDark, light: "#ffffff" },
        });
        return [card.id, qr] as const;
      })
    )
  );

  const withCards = memberships.filter((m) => cardByOrgId.has(m.orgId));
  const withoutCards = memberships.filter((m) => !cardByOrgId.has(m.orgId));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          My cards
        </h1>
        <p className="mt-1 text-sm text-[var(--app-fg-muted)]">
          One card per brand. Share the link or let someone scan the QR.
        </p>
      </header>

      {memberships.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--app-border-strong)] p-8 text-center text-sm text-[var(--app-fg-muted)]">
          You&apos;re not a member of any organization yet.
        </p>
      ) : null}

      {withCards.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {withCards.map(({ org }) => {
            const card = cardByOrgId.get(org.id)!;
            return (
              <section key={org.id}>
                <BrandCard
                  data={{
                    name: displayName,
                    jobTitle: card.jobTitle,
                    orgName: org.name,
                    logoUrl: org.logoUrl,
                    photoUrl: card.photoUrl,
                    primaryColor: org.primaryColor,
                    textColor: org.textColor,
                    secondaryColor: org.secondaryColor,
                    headingFont: org.headingFont,
                  }}
                  qrDataUrl={qrByCardId.get(card.id)}
                  size="sm"
                />
                <CardActions
                  publicPath={`/c/${org.slug}/${card.slug}`}
                  editPath={`/dashboard/card/edit/${org.slug}`}
                  name={displayName}
                  orgName={org.name}
                />
              </section>
            );
          })}
        </div>
      ) : null}

      {withoutCards.length > 0 ? (
        <section>
          <h2 className="px-1 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--app-fg-subtle)]">
            Brands without a card yet
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {withoutCards.map(({ org, role }) => (
              <Link
                key={org.id}
                href={`/dashboard/card/edit/${org.slug}`}
                className="group flex min-h-[72px] items-center gap-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 transition-colors duration-200 hover:border-[var(--app-border-strong)] hover:bg-white/[0.04]"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${org.primaryColor}, ${org.secondaryColor})`,
                  }}
                  aria-hidden
                >
                  <Sparkles size={18} strokeWidth={1.9} className="text-white/90" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-white">
                    {org.name}
                  </span>
                  <span className="text-xs text-[var(--app-fg-subtle)]">
                    {role}
                  </span>
                </span>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-white transition-colors duration-200 group-hover:bg-[var(--accent)]"
                  aria-hidden
                >
                  <Plus size={18} strokeWidth={2.2} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
