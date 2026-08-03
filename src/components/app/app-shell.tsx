"use client";

import { motion } from "framer-motion";
import { BarChart3, Home, Layers, RotateCcw, Settings } from "lucide-react";
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
  { href: "/dashboard", label: "Progress", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Mobile-first shell: a bottom tab bar on small screens, a fixed sidebar from
 * `lg` up. One nav definition drives both so they can never diverge.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { progress, entitlements } = useProgress();
  const due = entitlements.reviewQueue ? dueCount(progress) : 0;

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-card/40 px-3 py-5 lg:flex">
        <Link href="/home" className="mb-7 flex items-center gap-2.5 px-2">
          <Logo />
          <span className="text-[0.9375rem] font-semibold tracking-tight">
            {BRAND.name}
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
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
        <main className="flex-1 px-4 py-5 pb-safe-nav sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>

      <MobileTabBar pathname={pathname} due={due} />
    </div>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md pt-safe lg:hidden">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <Logo />
        <span className="text-[0.9375rem] font-semibold tracking-tight">
          {BRAND.name}
        </span>
      </div>
    </header>
  );
}

function MobileTabBar({ pathname, due }: { pathname: string; due: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md pb-safe lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === "/review" && due > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-semibold text-primary-foreground">
                    {due > 99 ? "99+" : due}
                  </span>
                ) : null}
              </span>
              {item.label}
              {active ? (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      {badge > 0 ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-semibold text-primary-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md bg-primary/15",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-primary" fill="none">
        <path
          d="M12 3 4.5 6.2v5.1c0 4.4 3 8.5 7.5 9.7 4.5-1.2 7.5-5.3 7.5-9.7V6.2L12 3Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="m9 11.8 2.1 2.2L15 10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
