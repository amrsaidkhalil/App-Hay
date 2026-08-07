import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, MessageCircle, Mail, Check } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { prisma } from "@/lib/prisma";
import { ContactMenu } from "@/components/contact-menu";
import { updateContactAction } from "./actions";

function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { saved } = await searchParams;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    select: { orgId: true },
  });
  const orgIds = memberships.map((m) => m.orgId);

  const contact = await prisma.scannedContact.findFirst({
    where: { id, orgId: { in: orgIds } },
    include: { org: true },
  });
  if (!contact) notFound();

  const telHref = contact.phone
    ? `tel:${contact.phone.replace(/[^\d+]/g, "")}`
    : null;
  const smsHref = contact.phone
    ? `sms:${contact.phone.replace(/[^\d+]/g, "")}`
    : null;
  const mailHref = contact.email ? `mailto:${contact.email}` : null;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/leads"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:text-[var(--app-fg)]"
        >
          <ArrowLeft size={16} strokeWidth={1.9} aria-hidden />
          Contacts
        </Link>
        <ContactMenu contactId={contact.id} />
      </div>

      <div className="flex flex-col items-center text-center">
        <span
          className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${contact.org.primaryColor}, ${contact.org.secondaryColor})`,
          }}
          aria-hidden
        >
          {initials(contact.name)}
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--app-fg)]">
          {contact.name ?? "Unnamed contact"}
        </h1>
        <p className="mt-1 text-sm text-[var(--app-fg-subtle)]">
          Added {contact.createdAt.toLocaleDateString()} · {contact.org.name}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <a
          href={telHref ?? undefined}
          aria-disabled={!telHref}
          className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-medium text-[var(--app-fg)] transition-colors duration-200 ${
            telHref ? "hover:bg-[var(--app-overlay)]" : "pointer-events-none opacity-40"
          }`}
        >
          <Phone size={19} strokeWidth={1.8} aria-hidden />
          Call
        </a>
        <a
          href={smsHref ?? undefined}
          aria-disabled={!smsHref}
          className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-medium text-[var(--app-fg)] transition-colors duration-200 ${
            smsHref ? "hover:bg-[var(--app-overlay)]" : "pointer-events-none opacity-40"
          }`}
        >
          <MessageCircle size={19} strokeWidth={1.8} aria-hidden />
          Message
        </a>
        <a
          href={mailHref ?? undefined}
          aria-disabled={!mailHref}
          className={`flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] text-xs font-medium text-[var(--app-fg)] transition-colors duration-200 ${
            mailHref ? "hover:bg-[var(--app-overlay)]" : "pointer-events-none opacity-40"
          }`}
        >
          <Mail size={19} strokeWidth={1.8} aria-hidden />
          Email
        </a>
      </div>

      {saved ? (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          <Check size={16} strokeWidth={2.2} aria-hidden />
          Saved.
        </p>
      ) : null}

      <form action={updateContactAction} className="space-y-4">
        <input type="hidden" name="id" value={contact.id} />

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Full name
          </span>
          <input
            name="name"
            defaultValue={contact.name ?? ""}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Job title
          </span>
          <input
            name="jobTitle"
            defaultValue={contact.jobTitle ?? ""}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Company
          </span>
          <input
            name="company"
            defaultValue={contact.company ?? ""}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Email
          </span>
          <input
            name="email"
            type="email"
            defaultValue={contact.email ?? ""}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium text-[var(--app-fg-muted)]">
            Phone
          </span>
          <input
            name="phone"
            type="tel"
            defaultValue={contact.phone ?? ""}
            className="input"
          />
        </label>

        <button type="submit" className="btn-primary w-full">
          Save changes
        </button>
      </form>
    </div>
  );
}
