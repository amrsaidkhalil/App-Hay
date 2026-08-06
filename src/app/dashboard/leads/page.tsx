import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";

const SOURCE_LABELS: Record<string, string> = {
  AI_SCAN: "AI scan",
  CARD_INBOUND: "Shared via card",
};

export default async function LeadsPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every contact captured by the scanner or shared through a public
            card page.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/dashboard/leads/export"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Export CSV
          </a>
          <button
            type="button"
            disabled
            title="Coming soon — needs a Google OAuth client for Contacts sync"
            className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400"
          >
            Sync to Google Contacts
          </button>
        </div>
      </div>

      {contacts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No leads yet. Scan a business card or share your public card link to
          start collecting contacts.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Org</th>
                <th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Captured</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900">{c.name}</div>
                    {c.jobTitle && (
                      <div className="text-xs text-slate-400">{c.jobTitle}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{c.company ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {c.email ?? "—"}
                    {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{c.org.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {SOURCE_LABELS[c.source] ?? c.source}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">
                    {c.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
