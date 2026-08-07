import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Card palette per brand:
 *   primaryColor   → solid card background
 *   textColor      → text printed on the card
 *   secondaryColor → accent (logo ring, QR modules)
 *
 * Bilaal TV uses its real identity from bilaal-tv-web/BRAND.md: gold on black.
 */
const ORGS = [
  {
    slug: "bilaal-tv",
    name: "Bilaal TV",
    primaryColor: "#0a0a0a",
    textColor: "#ffffff",
    secondaryColor: "#e9b216",
    headingFont: "Poetsen One",
    bodyFont: "Poppins",
  },
  {
    slug: "action-mc",
    name: "Action MC",
    primaryColor: "#1c1917",
    textColor: "#ffffff",
    secondaryColor: "#f97316",
    headingFont: "Poppins",
    bodyFont: "Poppins",
  },
];

async function main() {
  for (const org of ORGS) {
    await prisma.organization.upsert({
      where: { slug: org.slug },
      update: org,
      create: org,
    });
  }

  const devUser = await prisma.user.upsert({
    where: { email: "amr@example.com" },
    update: {},
    create: { email: "amr@example.com", name: "Amr Khalil (dev)", image: null },
  });

  const realUser = await prisma.user.upsert({
    where: { email: "amrsaidkhalil@gmail.com" },
    update: { name: "Amr Khalil" },
    create: { email: "amrsaidkhalil@gmail.com", name: "Amr Khalil", image: null },
  });

  const keptOrgs = await prisma.organization.findMany({
    where: { slug: { in: ORGS.map((o) => o.slug) } },
  });

  for (const user of [devUser, realUser]) {
    for (const org of keptOrgs) {
      await prisma.membership.upsert({
        where: { userId_orgId: { userId: user.id, orgId: org.id } },
        update: { role: "OWNER" },
        create: { userId: user.id, orgId: org.id, role: "OWNER" },
      });
    }
  }

  const bilaalTv = keptOrgs.find((o) => o.slug === "bilaal-tv")!;

  for (const [user, slug] of [
    [devUser, "amr-khalil-dev"],
    [realUser, "amr-khalil"],
  ] as const) {
    await prisma.card.upsert({
      where: {
        orgId_ownerUserId: { orgId: bilaalTv.id, ownerUserId: user.id },
      },
      update: {},
      create: {
        orgId: bilaalTv.id,
        ownerUserId: user.id,
        slug,
        jobTitle: "Founder & Director",
        email: "amr@bilaal.tv",
        website: "https://bilaal.tv",
        socialLinks: JSON.stringify({}),
      },
    });
  }

  // Retire the client-org placeholders — but never delete an org that has real
  // data under it. Cards and captured contacts cascade-delete with the org, so
  // an unguarded prune here would quietly destroy work.
  const retired = await prisma.organization.findMany({
    where: { slug: { notIn: ORGS.map((o) => o.slug) } },
    include: { _count: { select: { cards: true, scannedContacts: true } } },
  });

  const kept: string[] = [];
  for (const org of retired) {
    if (org._count.cards > 0 || org._count.scannedContacts > 0) {
      kept.push(org.slug);
      continue;
    }
    await prisma.organization.delete({ where: { id: org.id } });
  }

  console.log("Seed complete:", {
    orgs: ORGS.map((o) => o.slug),
    removed: retired.length - kept.length,
    keptBecauseTheyHoldData: kept,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
