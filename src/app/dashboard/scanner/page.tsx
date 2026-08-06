import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { scannerConfigured } from "@/lib/scan-card";
import { ScannerForm } from "@/components/scanner-form";

export default async function ScannerPage() {
  const user = await requireUser();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { org: true },
    orderBy: { org: { name: "asc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">AI Contact Scanner</h1>
        <p className="mt-1 text-sm text-slate-500">
          Photograph a physical business card and it&apos;ll be parsed into a
          lead automatically.
        </p>
      </div>

      {!scannerConfigured ? (
        <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
          Not configured yet. Set <code className="font-mono">ANTHROPIC_API_KEY</code>{" "}
          in <code className="font-mono">.env</code> to enable the scanner.
        </p>
      ) : memberships.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          You need to belong to an organization before saving leads.
        </p>
      ) : (
        <ScannerForm
          orgs={memberships.map((m) => ({ slug: m.org.slug, name: m.org.name }))}
        />
      )}
    </div>
  );
}
