import Link from "next/link";
import { CreditCard, ScanLine, Users, Settings } from "lucide-react";
import { requireUser } from "@/lib/require-user";
import { BottomNav } from "@/components/bottom-nav";

const DESKTOP_TABS = [
  { href: "/dashboard", label: "Cards", Icon: CreditCard },
  { href: "/dashboard/scanner", label: "Scanner", Icon: ScanLine },
  { href: "/dashboard/leads", label: "Contacts", Icon: Users },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--app-bg)] text-[var(--app-fg)]">
      <header
        className="sticky top-0 z-30 border-b border-[var(--app-border)] bg-[var(--app-bg)]/85 backdrop-blur-xl"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="-my-2 flex min-h-[44px] items-center text-[15px] font-semibold tracking-tight text-white"
          >
            Digital Cards
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {DESKTOP_TABS.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--app-fg-muted)] transition-colors duration-200 hover:bg-white/5 hover:text-white"
                  >
                    <Icon size={16} strokeWidth={1.8} aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <span className="truncate text-sm text-[var(--app-fg-muted)]">
            {user.name ?? user.email}
          </span>
        </div>
      </header>

      {/* pb clears the fixed bottom nav on mobile */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 md:pb-12">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
