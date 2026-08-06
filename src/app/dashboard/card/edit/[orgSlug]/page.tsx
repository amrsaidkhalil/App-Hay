import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { parseSocialLinks } from "@/lib/utils";
import { CardEditorForm } from "@/components/card-editor-form";
import { saveCardAction } from "./actions";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {membership.org.name} card
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Edits show up instantly in the preview on the right.
        </p>
        {saved ? (
          <p className="mt-2 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
            Saved.
          </p>
        ) : null}
      </div>

      <CardEditorForm
        orgSlug={orgSlug}
        orgName={membership.org.name}
        cardSlug={card?.slug ?? ""}
        theme={{
          primaryColor: membership.org.primaryColor,
          secondaryColor: membership.org.secondaryColor,
          headingFont: membership.org.headingFont,
        }}
        initial={{
          name: user.name ?? user.email,
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
      />
    </div>
  );
}
