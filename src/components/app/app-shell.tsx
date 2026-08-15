"use client";

import { BarChart3, Home, Layers, RotateCcw, Settings, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dueCount } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/study", label: "Study", icon: Layers },
  { href: "/review", label: "Review", icon: RotateCcw },
  { href: "/exam", label: "Exam", icon: Timer },
  { href: "/dashboard", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Mobile-first shell: a bottom tab bar on small screens, a fixed sidebar from
 * `lg` up. One nav definition drives both so they can never diverge.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { progress } = useProgress();
  const due = dueCount(progress);

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-card/40 px-2 py-4 lg:flex">
        {/*
          A wordmark, not a logo lockup. The source system is terminal-native
          and rejects chrome, so the mark sits bare next to the name and the
          name is allowed the width to stay on one line.
        */}
        <Link href="/home" className="mb-5 flex items-center px-2 no-underline">
          <span className="whitespace-nowrap font-serif text-[0.9375rem] font-medium italic tracking-[-0.01em]">
            {BRAND.name}
          </span>
        </Link>

        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <SidebarLink
              key={item.href}
              {...item}
              active={isActive(pathname, item.href)}
              badge={item.href === "/review" ? due : 0}
            />
          ))}
        </nav>

        <p className="mt-auto px-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
          Independent educational product. Not affiliated with any certification
          body.
        </p>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 px-6 py-5 pb-safe-nav lg:pb-10 lg:pt-8">
          {/* 1280px containment with 1.5rem side padding, per the layout rule. */}
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
      </div>

      <MobileTabBar pathname={pathname} due={due} />
    </div>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background pt-safe lg:hidden">
      <div className="flex h-14 items-center px-4">
        <span className="font-serif text-[1.0625rem] font-medium italic tracking-[-0.01em]">
          {BRAND.name}
        </span>
      </div>
    </header>
  );
}

function MobileTabBar({ pathname, due }: { pathname: string; due: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-safe lg:hidden">
      {/* One column per nav entry. A fixed count silently wraps to a second
          row when an item is added, which doubles the bar's height and buries
          whatever is anchored above it. */}
      <div
        className="mx-auto grid max-w-lg"
        style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}
      >
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-w-0 flex-col items-center gap-1 px-0.5 py-2.5 text-center text-[0.6875rem] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === "/review" && due > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center bg-destructive px-1 text-[0.625rem] font-semibold text-destructive-foreground">
                    {due > 99 ? "99+" : due}
                  </span>
                ) : null}
              </span>
              {item.label}
              {active ? (
                <span className="absolute inset-x-4 top-0 h-0.5 bg-accent" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  badge: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        /*
          The spec is explicit: "Active item: accent color indicator. Font
          weight 500 when active." This used to be a filled grey block, which
          is the generic pattern the rest of the system avoids — and it
          disagreed with the mobile tab bar, which already drew an indicator.
        */
        "relative flex items-center gap-2.5 py-1.5 pl-3.5 pr-2 font-mono text-[0.8125rem]",
        "tracking-[0.01em] no-underline transition-colors",
        active
          ? "font-medium text-foreground"
          : "font-normal text-muted-foreground hover:text-foreground",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 w-0.5 bg-accent"
        />
      ) : null}
      <Icon className={cn("h-4 w-4", active ? "text-accent" : "")} />
      {label}
      {badge > 0 ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center bg-destructive px-1.5 text-[0.6875rem] font-semibold text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
