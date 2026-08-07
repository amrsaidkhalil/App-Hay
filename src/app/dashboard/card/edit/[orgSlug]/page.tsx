import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { parseSocialLinks } from "@/lib/utils";
import { blobConfigured } from "@/lib/upload";
import { CardEditorForm } from "@/components/card-editor-form";
import { saveCardAction, uploadCardPhotoAction } from "./actions";

export default async function EditCardPage({
  params,
  searchParams,
}: PageProps<"/dashboard/card/edit/[orgSlug]">) {
  const { orgSlug } = await params;
  const { saved } = await searchParams;
  const user = await requireUser();

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug: orgSlug } },
    include: { org: true },
  });
  if (!membership) notFound();

  const card = await prisma.card.findUnique({
    where: {
      orgId_ownerUserId: { orgId: membership.orgId, ownerUserId: user.id },
    },
  });

  const social = parseSocialLinks(card?.socialLinks ?? "{}");
  const { org } = membership;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          My cards
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {org.name} card
        </h1>
        <p className="mt-1 text-sm text-[var(--app-fg-muted)]">
          Changes show in the preview instantly.
        </p>
        {saved ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-400/12 px-3.5 py-2 text-sm text-emerald-300">
            <Check size={15} strokeWidth={2.4} aria-hidden />
            Card saved
          </p>
        ) : null}
      </div>

      <CardEditorForm
        orgSlug={orgSlug}
        orgName={org.name}
        ownerName={user.name ?? user.email}
        cardSlug={card?.slug ?? ""}
        canUpload={blobConfigured}
        initialPhoto={card?.photoUrl ?? ""}
        initialPhotoFraming={{
          scale: card?.photoScale ?? 1,
          offsetX: card?.photoOffsetX ?? 0,
          offsetY: card?.photoOffsetY ?? 0,
        }}
        theme={{
          primaryColor: org.primaryColor,
          textColor: org.textColor,
          secondaryColor: org.secondaryColor,
          headingFont: org.headingFont,
          logoUrl: org.logoUrl,
          logoFraming: {
            scale: org.logoScale,
            offsetX: org.logoOffsetX,
            offsetY: org.logoOffsetY,
          },
        }}
        initial={{
          jobTitle: card?.jobTitle ?? "",
          phone: card?.phone ?? "",
          whatsapp: card?.whatsapp ?? "",
          email: card?.email ?? user.email,
          website: card?.website ?? "",
          instagram: social.instagram ?? "",
          linkedin: social.linkedin ?? "",
          twitter: social.twitter ?? "",
          facebook: social.facebook ?? "",
        }}
        saveAction={saveCardAction}
        uploadAction={uploadCardPhotoAction}
      />
    </div>
  );
}
