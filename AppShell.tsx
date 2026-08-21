"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, Icon, paths } from "@/components/ui";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  {
    group: "Overview",
    items: [
      { href: "/app", label: "Dashboard", icon: paths.home, exact: true },
      { href: "/app/analytics", label: "Analytics", icon: paths.chart },
      { href: "/app/signals", label: "Signals", icon: paths.spark },
    ],
  },
  {
    group: "Explore",
    items: [
      { href: "/app/properties", label: "Properties", icon: paths.building },
      { href: "/app/map", label: "Map", icon: paths.pin },
      { href: "/app/compare", label: "Compare", icon: paths.compare },
    ],
  },
  {
    group: "Data",
    items: [
      { href: "/app/upload", label: "Upload", icon: paths.upload },
      { href: "/app/imports", label: "Import history", icon: paths.layers },
    ],
  },
  {
    group: "Workspace",
    items: [
      { href: "/app/insights", label: "Insights", icon: paths.spark },
      { href: "/app/reports", label: "Reports", icon: paths.doc },
      { href: "/app/saved", label: "Saved", icon: paths.bookmark },
    ],
  },
];

const MOBILE_NAV = [
  { href: "/app", label: "Home", icon: paths.home, exact: true },
  { href: "/app/properties", label: "Properties", icon: paths.building },
  { href: "/app/map", label: "Map", icon: paths.pin },
  { href: "/app/insights", label: "Insights", icon: paths.spark },
];

function Brand() {
  return (
    <Link href="/app" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-pine text-cream">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 21V9l6-5 6 5v12M16 21v-8l4-3v11M3 21h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[17px] font-semibold tracking-[-0.02em]">PropertyIQ</span>
        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.22em] text-ink-3">Market Intelligence</span>
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [more, setMore] = useState(false);
  const initial = (user.displayName || user.name).trim().charAt(0).toUpperCase();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", body: "{}", headers: { "Content-Type": "application/json" } });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-cream md:flex">
        <div className="border-b border-line px-5 py-5">
          <Brand />
        </div>
        <nav className="thin-scroll flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((g) => (
            <div key={g.group} className="mb-5">
              <div className="px-2 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-ink-3">{g.group}</div>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active = isActive(pathname, it.href, "exact" in it && it.exact);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                          active ? "bg-pine-tint text-pine-deep" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
                        )}
                      >
                        <Icon d={it.icon} size={15} className={active ? "text-pine" : "text-ink-3"} />
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <Link href="/app/settings" className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors", isActive(pathname, "/app/settings") ? "bg-pine-tint text-pine-deep" : "hover:bg-ink/5")}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-cream">{initial}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium">{user.displayName || user.name}</span>
              <span className="block truncate text-[10.5px] text-ink-3">{user.email}</span>
            </span>
          </Link>
          <button onClick={logout} className="mt-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink">
            <Icon d={paths.logout} size={15} className="text-ink-3" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-cream/95 px-4 py-3 backdrop-blur md:hidden">
        <Brand />
        <button onClick={() => setMore(true)} aria-label="Menu" className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-card">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1.5 3.5h11M1.5 7h11M1.5 10.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-cream/97 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {MOBILE_NAV.map((it) => {
          const active = isActive(pathname, it.href, "exact" in it && it.exact);
          return (
            <Link key={it.href} href={it.href} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium", active ? "text-pine" : "text-ink-3")}>
              <Icon d={it.icon} size={17} />
              {it.label}
            </Link>
          );
        })}
        <button onClick={() => setMore(true)} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-ink-3">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="12" r="1.6" fill="currentColor" />
            <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            <circle cx="19" cy="12" r="1.6" fill="currentColor" />
          </svg>
          More
        </button>
      </nav>

      {/* More sheet */}
      {more ? (
        <div className="fixed inset-0 z-[1100] md:hidden">
          <div className="anim-fade absolute inset-0 bg-ink/40" onClick={() => setMore(false)} />
          <div className="anim-pop absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-xl border-t border-line bg-cream p-4 pb-8">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-cream">{initial}</span>
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium">{user.displayName || user.name}</div>
                <div className="truncate text-[11.5px] text-ink-3">{user.email}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[...NAV.flatMap((g) => g.items), { href: "/app/settings", label: "Settings", icon: paths.user }].map((it) => (
                <Link key={it.href} href={it.href} onClick={() => setMore(false)} className={cn("flex items-center gap-2 rounded-md border border-line bg-card px-3 py-2.5 text-[13px] font-medium", isActive(pathname, it.href) ? "border-pine/40 bg-pine-tint text-pine-deep" : "text-ink-2")}>
                  <Icon d={it.icon} size={14} />
                  {it.label}
                </Link>
              ))}
              <button onClick={logout} className="col-span-2 flex items-center justify-center gap-2 rounded-md border border-rust/30 bg-rust-tint px-3 py-2.5 text-[13px] font-medium text-rust">
                <Icon d={paths.logout} size={14} /> Sign out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main */}
      <main className="min-h-screen pb-24 md:pb-10 md:pl-60">
        <div key={pathname} className="anim-fade mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
