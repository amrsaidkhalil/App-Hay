import { notFound } from "next/navigation";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { saveOrgSettingsAction } from "./actions";

export default async function OrgSettingsPage({
  params,
  searchParams,
}: PageProps<"/dashboard/org/[slug]/settings">) {
  const { slug } = await params;
  const { saved } = await searchParams;
  const user = await requireUser();

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { slug } },
    include: { org: true },
  });
  if (!membership) notFound();
  const canEdit = membership.role === "OWNER" || membership.role === "ADMIN";

  const { org } = membership;

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {org.name} — brand settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Colors and fonts applied to every card and public page under this
          org.
        </p>
        {saved ? (
          <p className="mt-2 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
            Saved.
          </p>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Only org owners or admins can edit branding. Your role: {membership.role}.
        </p>
      ) : (
        <form action={saveOrgSettingsAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <input type="hidden" name="slug" value={slug} />

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Organization name
            </span>
            <input name="name" defaultValue={org.name} className="input" />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Logo URL
            </span>
            <input
              name="logoUrl"
              defaultValue={org.logoUrl ?? ""}
              className="input"
              placeholder="https://…/logo.png"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Primary color
              </span>
              <input
                type="color"
                name="primaryColor"
                defaultValue={org.primaryColor}
                className="h-10 w-full rounded-lg border border-slate-200"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">
                Secondary color
              </span>
              <input
                type="color"
                name="secondaryColor"
                defaultValue={org.secondaryColor}
                className="h-10 w-full rounded-lg border border-slate-200"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              Heading font
            </span>
            <select
              name="headingFont"
              defaultValue={org.headingFont}
              className="input"
            >
              <option value="Poppins">Poppins</option>
              <option value="Poetsen One">Poetsen One</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Save settings
          </button>
        </form>
      )}
    </div>
  );
}
