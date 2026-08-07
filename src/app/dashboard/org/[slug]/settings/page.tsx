import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { blobConfigured } from "@/lib/upload";
import { BrandingForm } from "@/components/branding-form";
import { saveOrgSettingsAction, uploadOrgLogoAction } from "./actions";

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
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-[var(--app-fg)]"
        >
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          Settings
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
          {org.name} branding
        </h1>
        <p className="mt-1 text-sm text-[var(--app-fg-muted)]">
          Applies to every card and public page under this brand.
        </p>
        {saved ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-400/12 px-3.5 py-2 text-sm text-emerald-700">
            <Check size={15} strokeWidth={2.4} aria-hidden />
            Branding saved
          </p>
        ) : null}
      </div>

      {!canEdit ? (
        <p className="rounded-2xl border border-dashed border-[var(--app-border-strong)] p-6 text-sm text-[var(--app-fg-muted)]">
          Only owners and admins can edit branding. Your role: {membership.role}.
        </p>
      ) : (
        <BrandingForm
          orgSlug={slug}
          ownerName={user.name ?? user.email}
          canUpload={blobConfigured}
          initial={{
            name: org.name,
            logoUrl: org.logoUrl ?? "",
            logoFraming: {
              scale: org.logoScale,
              offsetX: org.logoOffsetX,
              offsetY: org.logoOffsetY,
            },
            primaryColor: org.primaryColor,
            textColor: org.textColor,
            secondaryColor: org.secondaryColor,
            headingFont: org.headingFont,
          }}
          saveAction={saveOrgSettingsAction}
          uploadAction={uploadOrgLogoAction}
        />
      )}
    </div>
  );
}
