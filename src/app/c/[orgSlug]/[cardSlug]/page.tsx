import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { parseSocialLinks } from "@/lib/utils";
import { getBaseUrl } from "@/lib/site-url";
import { appleWalletConfigured } from "@/lib/wallet/apple";
import { googleWalletConfigured, buildGoogleWalletSaveUrl } from "@/lib/wallet/google";
import { shareContactBackAction } from "./actions";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  facebook: "Facebook",
};

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
  if (!card) notFound();

  const social = parseSocialLinks(card.socialLinks);
  const baseUrl = await getBaseUrl();
  const pageUrl = `${baseUrl}/c/${orgSlug}/${cardSlug}`;
  const qrDataUrl = await QRCode.toDataURL(pageUrl, {
    margin: 1,
    width: 240,
    color: { dark: card.org.primaryColor, light: "#ffffff" },
  });

  const headingStyle =
    card.org.headingFont === "Poetsen One"
      ? { fontFamily: "var(--font-poetsen)" }
      : undefined;

  const googleWalletUrl = googleWalletConfigured
    ? await buildGoogleWalletSaveUrl({
        cardId: card.id,
        fullName: card.owner.name ?? card.owner.email,
        jobTitle: card.jobTitle,
        orgName: card.org.name,
        phone: card.phone,
        email: card.email,
        primaryColorHex: card.org.primaryColor,
        cardUrl: pageUrl,
      }).catch(() => null)
    : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="flex h-32 items-end p-6"
          style={{
            background: `linear-gradient(135deg, ${card.org.primaryColor}, ${card.org.secondaryColor})`,
          }}
        >
          <div className="h-20 w-20 rounded-full border-4 border-white bg-slate-200" />
        </div>

        <div className="space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900" style={headingStyle}>
              {card.owner.name ?? card.owner.email}
            </h1>
            <p className="text-sm text-slate-500">
              {card.jobTitle ?? ""} {card.jobTitle ? "·" : ""} {card.org.name}
            </p>
          </div>

          <dl className="space-y-1.5 text-sm text-slate-700">
            {card.phone && <div>📞 {card.phone}</div>}
            {card.whatsapp && <div>💬 {card.whatsapp} (WhatsApp)</div>}
            {card.email && <div>✉️ {card.email}</div>}
            {card.website && <div>🌐 {card.website}</div>}
          </dl>

          {Object.keys(social).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(social).map(([key, url]) =>
                url ? (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 transition hover:bg-slate-200"
                  >
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                ) : null
              )}
            </div>
          )}

          <a
            href={`/c/${orgSlug}/${cardSlug}/vcard`}
            className="block w-full rounded-lg py-2.5 text-center text-sm font-medium text-white"
            style={{ backgroundColor: card.org.primaryColor }}
          >
            Save contact
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled
              title={
                appleWalletConfigured
                  ? "Certs are set, but pass generation isn't implemented yet"
                  : "Coming soon — needs an Apple Developer Pass Type ID certificate"
              }
              className="cursor-not-allowed rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-400"
            >
              Apple Wallet (soon)
            </button>
            {googleWalletUrl ? (
              <a
                href={googleWalletUrl}
                className="flex items-center justify-center rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Add to Google Wallet
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Coming soon — needs a Google Wallet Issuer account"
                className="cursor-not-allowed rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-400"
              >
                Google Wallet (soon)
              </button>
            )}
          </div>

          <div className="flex justify-center pt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR code linking to this card"
              width={160}
              height={160}
              className="rounded-lg border border-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p className="font-medium text-slate-700">Share your info back</p>
        {shared ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
            Thanks — sent.
          </p>
        ) : (
          <form action={shareContactBackAction} className="mt-3 space-y-2">
            <input type="hidden" name="cardId" value={card.id} />
            <input type="hidden" name="orgSlug" value={orgSlug} />
            <input type="hidden" name="cardSlug" value={cardSlug} />
            <input name="name" placeholder="Your name" className="input" required />
            <input name="company" placeholder="Company" className="input" />
            <input name="email" type="email" placeholder="Email" className="input" />
            <input name="phone" placeholder="Phone" className="input" />
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
