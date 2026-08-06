import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVCard } from "@/lib/vcard";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/c/[orgSlug]/[cardSlug]/vcard">
) {
  const { orgSlug, cardSlug } = await params;

  const card = await prisma.card.findFirst({
    where: { slug: cardSlug, org: { slug: orgSlug } },
    include: { org: true, owner: true },
  });
  if (!card) return new NextResponse("Not found", { status: 404 });

  const vcard = buildVCard({
    fullName: card.owner.name ?? card.owner.email,
    orgName: card.org.name,
    jobTitle: card.jobTitle,
    phone: card.phone,
    whatsapp: card.whatsapp,
    email: card.email,
    website: card.website,
  });

  return new NextResponse(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${cardSlug}.vcf"`,
    },
  });
}
