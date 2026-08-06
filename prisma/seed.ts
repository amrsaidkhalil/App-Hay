import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ORGS = [
  {
    slug: "personal",
    name: "Personal",
    primaryColor: "#111827",
    secondaryColor: "#6b7280",
    headingFont: "Poppins",
    bodyFont: "Poppins",
  },
  {
    slug: "bilaal-tv",
    name: "Bilaal TV",
    primaryColor: "#e9b216",
    secondaryColor: "#34d399",
    headingFont: "Poetsen One",
    bodyFont: "Poppins",
  },
  {
    slug: "al-iman-foundation",
    name: "Al-Iman Foundation",
    primaryColor: "#0f766e",
    secondaryColor: "#f59e0b",
    headingFont: "Poppins",
    bodyFont: "Poppins",
  },
  {
    slug: "wings-of-mercy",
    name: "Wings of Mercy",
    primaryColor: "#1d4ed8",
    secondaryColor: "#f59e0b",
    headingFont: "Poppins",
    bodyFont: "Poppins",
  },
  {
    slug: "el-hudaa",
    name: "EL HUDAA",
    primaryColor: "#166534",
    secondaryColor: "#d4af37",
    headingFont: "Poppins",
    bodyFont: "Poppins",
  },
  {
    slug: "shura-council",
    name: "Shura Council",
    primaryColor: "#1e293b",
    secondaryColor: "#94a3b8",
    headingFont: "Poppins",
    bodyFont: "Poppins",
  },
  {
    slug: "action-mc",
    name: "Action MC",
    primaryColor: "#7c2d12",
    secondaryColor: "#f97316",
    headingFont: "Poppins",
    bodyFont: "Poppins",
  },
];

// Bilaal TV and Action MC are Amr's own ventures (OWNER); the rest are
// client orgs he runs the digital presence for via Action MC (ADMIN).
const OWNER_ORG_SLUGS = new Set(["bilaal-tv", "action-mc", "personal"]);

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
    create: {
      email: "amr@example.com",
      name: "Amr Khalil (dev)",
      image: null,
    },
  });

  const realUser = await prisma.user.upsert({
    where: { email: "amrsaidkhalil@gmail.com" },
    update: { name: "Amr Khalil" },
    create: {
      email: "amrsaidkhalil@gmail.com",
      name: "Amr Khalil",
      image: null,
    },
  });

  const allOrgs = await prisma.organization.findMany();

  for (const user of [devUser, realUser]) {
    for (const org of allOrgs) {
      const role = OWNER_ORG_SLUGS.has(org.slug) ? "OWNER" : "ADMIN";
      await prisma.membership.upsert({
        where: { userId_orgId: { userId: user.id, orgId: org.id } },
        update: { role },
        create: { userId: user.id, orgId: org.id, role },
      });
    }
  }

  const bilaalTv = allOrgs.find((o) => o.slug === "bilaal-tv")!;

  // devUser first, explicitly renamed off "amr-khalil" — an earlier seed run
  // may have already created its card at that slug, which realUser now needs.
  for (const [user, slug] of [
    [devUser, "amr-khalil-dev"],
    [realUser, "amr-khalil"],
  ] as const) {
    await prisma.card.upsert({
      where: {
        orgId_ownerUserId: { orgId: bilaalTv.id, ownerUserId: user.id },
      },
      update: { slug },
      create: {
        orgId: bilaalTv.id,
        ownerUserId: user.id,
        slug,
        jobTitle: "Founder & Director",
        phone: "+27 11 000 0000",
        whatsapp: "+27 11 000 0000",
        email: "amr@bilaal.tv",
        website: "https://bilaal.tv",
        socialLinks: JSON.stringify({
          instagram: "https://instagram.com/bilaaltv",
          linkedin: "https://linkedin.com/company/bilaaltv",
        }),
      },
    });
  }

  console.log("Seed complete:", {
    orgs: ORGS.length,
    devUser: devUser.email,
    realUser: realUser.email,
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
