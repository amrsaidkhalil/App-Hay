import {
  Phone,
  MessageCircle,
  Mail,
  Globe,
  type LucideIcon,
} from "lucide-react";

/** Strip non-dialable characters so tel:/wa.me links work. */
function digits(value: string) {
  return value.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

type Row = { icon: LucideIcon; label: string; value: string; href: string };

export function buildContactRows(card: {
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
}): Row[] {
  const rows: Row[] = [];
  if (card.phone)
    rows.push({
      icon: Phone,
      label: "Phone",
      value: card.phone,
      href: `tel:${digits(card.phone)}`,
    });
  if (card.whatsapp)
    rows.push({
      icon: MessageCircle,
      label: "WhatsApp",
      value: card.whatsapp,
      href: `https://wa.me/${digits(card.whatsapp)}`,
    });
  if (card.email)
    rows.push({
      icon: Mail,
      label: "Email",
      value: card.email,
      href: `mailto:${card.email}`,
    });
  if (card.website)
    rows.push({
      icon: Globe,
      label: "Website",
      value: card.website.replace(/^https?:\/\//, ""),
      href: card.website.startsWith("http")
        ? card.website
        : `https://${card.website}`,
    });
  return rows;
}

/** Tappable contact row — whole row is the target, so it clears 44pt easily. */
export function ContactRow({ row }: { row: Row }) {
  const { icon: Icon, label, value, href } = row;
  return (
    <a
      href={href}
      className="flex min-h-[60px] items-center gap-3.5 px-4 py-3 transition-colors duration-200 hover:bg-[var(--app-overlay)] active:bg-[var(--app-overlay-strong)]"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-overlay-strong)] text-[var(--app-fg-muted)]"
        aria-hidden
      >
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] uppercase tracking-wide text-[var(--app-fg-subtle)]">
          {label}
        </span>
        <span className="block truncate text-[15px] text-[var(--app-fg)]">{value}</span>
      </span>
    </a>
  );
}
