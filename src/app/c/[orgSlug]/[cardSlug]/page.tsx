import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { UserPlus, Wallet, Check, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/dev-session";
import { prisma } from "@/lib/prisma";
import { parseSocialLinks } from "@/lib/utils";
import { getBaseUrl } from "@/lib/site-url";
import { appleWalletConfigured } from "@/lib/wallet/apple";
import {
  googleWalletConfigured,
  buildGoogleWalletSaveUrl,
} from "@/lib/wallet/google";
import { buildCardTheme } from "@/lib/brand";
import { BrandCard } from "@/components/brand-card";
import { buildContactRows, ContactRow } from "@/components/contact-rows";
import { SOCIAL_GLYPHS } from "@/components/social-icons";
import { shareContactBackAction } from "./actions";

export default async function PublicCardPage({
  params,
  searchParams,
}: PageProps<"/c/[orgSlug]/[cardSlug]">) {
  const { orgSlug, cardSlug } = await params;
  const { shared } = await searchParams;

  const card = await prisma.card.findFirst({
    where: { slug: cardSlug, org: { slug: orgSlug } },
    include: { org: true, owner: true },
  });

  // Not found under the current slug — it may have been renamed. A printed
  // QR code or a link already handed out shouldn't dead-end just because the
  // owner edited their card, so follow the redirect chain instead of 404ing.
  if (!card) {
    const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
    const history = org
      ? await prisma.cardSlugHistory.findUnique({
          where: { orgId_slug: { orgId: org.id, slug: cardSlug } },
          include: { card: true },
        })
      : null;
    if (history) redirect(`/c/${orgSlug}/${history.card.slug}`);
    notFound();
  }

  const social = parseSocialLinks(card.socialLinks);
  const baseUrl = await getBaseUrl();
  const pageUrl = `${baseUrl}/c/${orgSlug}/${cardSlug}`;
  const theme = buildCardTheme(
    card.org.primaryColor,
    card.org.textColor,
    card.org.secondaryColor,
    card.org.headingFont
  );
  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    margin: 0,
    width: 380,
    color: { dark: theme.qrDark, light: theme.qrLight },
  });

  const displayName = card.owner.name ?? card.owner.email;
  const rows = buildContactRows(card);

  // Owners land here from the dashboard and need a way back. Recipients should
  // never see an app link they can't use, so it's gated on ownership.
  const viewer = await getCurrentUser();
  const viewerOwnsCard = viewer?.id === card.ownerUserId;

  const googleWalletUrl = googleWalletConfigured
    ? await buildGoogleWalletSaveUrl({
        cardId: card.id,
        fullName: displayName,
        jobTitle: card.jobTitle,
        orgName: card.org.name,
        phone: card.phone,
        email: card.email,
        primaryColorHex: card.org.primaryColor,
        cardUrl: pageUrl,
      }).catch(() => null)
    : null;

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-10"
      style={{ paddingTop: "calc(var(--safe-top) + 1rem)" }}
    >
      {viewerOwnsCard ? (
        <Link
          href="/dashboard"
          className="mb-2 inline-flex min-h-[44px] items-center gap-1.5 self-start text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          Back to my cards
        </Link>
      ) : null}

      <BrandCard
        data={{
          name: displayName,
          jobTitle: card.jobTitle,
          orgName: card.org.name,
          logoUrl: card.org.logoUrl,
          logoFraming: {
            scale: card.org.logoScale,
            offsetX: card.org.logoOffsetX,
            offsetY: card.org.logoOffsetY,
          },
          photoUrl: card.photoUrl,
          photoFraming: {
            scale: card.photoScale,
            offsetX: card.photoOffsetX,
            offsetY: card.photoOffsetY,
          },
          primaryColor: card.org.primaryColor,
          textColor: card.org.textColor,
          secondaryColor: card.org.secondaryColor,
          headingFont: card.org.headingFont,
        }}
        qrDataUrl={qrDataUrl}
      />

      <a href={`/c/${orgSlug}/${cardSlug}/vcard`} className="btn-primary mt-5 w-full">
        <UserPlus size={18} strokeWidth={1.9} aria-hidden />
        Save to contacts
      </a>

      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        {googleWalletUrl ? (
          <a href={googleWalletUrl} className="btn-ghost text-sm">
            <Wallet size={16} strokeWidth={1.8} aria-hidden />
            Google Wallet
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="Coming soon — needs a Google Wallet Issuer account"
            className="btn-ghost cursor-not-allowed text-sm opacity-45"
          >
            <Wallet size={16} strokeWidth={1.8} aria-hidden />
            Google Wallet
          </button>
        )}
        <button
          type="button"
          disabled
          title={
            appleWalletConfigured
              ? "Certificates are set, but pass generation isn't implemented yet"
              : "Coming soon — needs an Apple Developer Pass Type ID certificate"
          }
          className="btn-ghost cursor-not-allowed text-sm opacity-45"
        >
          <Wallet size={16} strokeWidth={1.8} aria-hidden />
          Apple Wallet
        </button>
      </div>

      {rows.length > 0 ? (
        <div className="mt-6 divide-y divide-[var(--app-border)] overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          {rows.map((row) => (
            <ContactRow key={row.label} row={row} />
          ))}
        </div>
      ) : null}

      {Object.values(social).some(Boolean) ? (
        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {Object.entries(social).map(([key, url]) => {
            if (!url) return null;
            const meta = SOCIAL_GLYPHS[key];
            if (!meta) return null;
            const { Glyph, label } = meta;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--app-border-strong)] text-[var(--app-fg-muted)] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white"
              >
                <Glyph size={18} />
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
        <h2 className="text-[15px] font-semibold text-white">
          Share your details back
        </h2>
        {shared ? (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-400/12 px-4 py-3 text-sm text-emerald-300">
            <Check size={16} strokeWidth={2.2} aria-hidden />
            Thanks — {displayName.split(" ")[0]} has your details.
          </p>
        ) : (
          <form action={shareContactBackAction} className="mt-4 space-y-2.5">
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="orgSlug" value={orgSlug} />
            <input type="hidden" name="cardSlug" value={cardSlug} />
            <label className="block">
              <span className="sr-only">Your name</span>
              <input name="name" placeholder="Your name" className="input" required />
            </label>
            <label className="block">
              <span className="sr-only">Company</span>
              <input name="company" placeholder="Company" className="input" />
            </label>
            <label className="block">
              <span className="sr-only">Email</span>
              <input name="email" type="email" placeholder="Email" className="input" />
            </label>
            <label className="block">
              <span className="sr-only">Phone</span>
              <input name="phone" type="tel" placeholder="Phone" className="input" />
            </label>
            <button type="submit" className="btn-primary w-full">
              Send my details
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-[var(--app-fg-subtle)]">
        {card.org.name}
      </p>
    </div>
  );
}
