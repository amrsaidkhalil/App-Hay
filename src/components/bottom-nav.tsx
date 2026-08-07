"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, ScanLine, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

// Bottom nav is capped at 4 destinations — past ~5 it stops being scannable.
const TABS = [
  { href: "/dashboard", label: "Cards", Icon: CreditCard },
  { href: "/dashboard/scanner", label: "Scanner", Icon: ScanLine },
  { href: "/dashboard/leads", label: "Contacts", Icon: Users },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-border)] bg-[var(--app-surface)]/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          // Only /dashboard needs an exact match; the rest own their subtrees.
          const active =
            href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-200",
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--app-fg-subtle)] active:text-[var(--app-fg)]"
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                <span className="text-[11px] font-medium leading-none">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
