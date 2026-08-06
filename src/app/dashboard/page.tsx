import Link from "next/link";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: { org: { name: "asc" } },
  });

  const cards = await prisma.card.findMany({
    where: { ownerUserId: user.id },
    include: { org: true },
  });

  const cardByOrgId = new Map(cards.map((card) => [card.orgId, card]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">My cards</h1>
        <p className="mt-1 text-sm text-slate-500">
          One digital card per brand you belong to. Share the public link or
          QR code to hand someone your contact instantly.
        </p>
      </div>

      {memberships.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          You&apos;re not a member of any organization yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {memberships.map(({ org, role }) => {
            const card = cardByOrgId.get(org.id);
            return (
              <div
                key={org.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: org.primaryColor }}
                />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-slate-900">{org.name}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {role}
                    </span>
                  </div>

                  {card ? (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-slate-500">
                        /c/{org.slug}/{card.slug}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/card/edit/${org.slug}`}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                        >
                          Edit card
                        </Link>
                        <Link
                          href={`/c/${org.slug}/${card.slug}`}
                          target="_blank"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          View public page
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <Link
                        href={`/dashboard/card/edit/${org.slug}`}
                        className="inline-block rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
                      >
                        Create your card
                      </Link>
                    </div>
                  )}

                  {(role === "OWNER" || role === "ADMIN") && (
                    <Link
                      href={`/dashboard/org/${org.slug}/settings`}
                      className="mt-3 block text-xs text-slate-400 underline-offset-2 hover:underline"
                    >
                      Brand settings
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
