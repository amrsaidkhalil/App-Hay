import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
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
      name: "Amr Khalil",
      image: null,
    },
  });

  const bilaalTv = await prisma.organization.findUniqueOrThrow({
    where: { slug: "bilaal-tv" },
  });
  const actionMc = await prisma.organization.findUniqueOrThrow({
    where: { slug: "action-mc" },
  });

  for (const org of [bilaalTv, actionMc]) {
    await prisma.membership.upsert({
      where: { userId_orgId: { userId: devUser.id, orgId: org.id } },
      update: { role: "OWNER" },
      create: { userId: devUser.id, orgId: org.id, role: "OWNER" },
    });
  }

  await prisma.card.upsert({
    where: { orgId_slug: { orgId: bilaalTv.id, slug: "amr-khalil" } },
    update: {},
    create: {
      orgId: bilaalTv.id,
      ownerUserId: devUser.id,
      slug: "amr-khalil",
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

  console.log("Seed complete:", {
    orgs: ORGS.length,
    devUser: devUser.email,
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
