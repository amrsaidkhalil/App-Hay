import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { orgId: true },
  });
  const orgIds = memberships.map((m) => m.orgId);

  const contacts = await prisma.scannedContact.findMany({
    where: { orgId: { in: orgIds } },
    include: { org: true },
    orderBy: { createdAt: "desc" },
  });

  const csv = toCsv(
    ["Name", "Job title", "Company", "Phone", "Email", "Source", "Organization", "Captured at"],
    contacts.map((c) => [
      c.name,
      c.jobTitle,
      c.company,
      c.phone,
      c.email,
      c.source,
      c.org.name,
      c.createdAt.toISOString(),
    ])
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
