"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DimensionalMark, type MarkName } from "@/components/civic/dimensional-mark";
import { dueCount } from "@/lib/spaced-repetition";
import { useProgress } from "@/lib/store/progress-provider";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/*
  One nav definition drives the desktop rail and the mobile tab bar, so the two
  can never disagree about what routes exist or what they are called.

  Each entry carries a dimensional mark rather than a flat icon. The mark is
  always accompanied by its text label — on both surfaces — because the design
  system forbids meaning that lives in a visual object alone. That is also why
  the marks are `aria-hidden`: the label beside them is the accessible name, and
  announcing both would read every nav item twice.
*/
const NAV: { href: string; label: string; mark: MarkName }[] = [
  { href: "/home", label: "Home", mark: "home" },
  { href: "/study", label: "Study", mark: "study" },
  { href: "/review", label: "Review", mark: "review" },
  { href: "/exam", label: "Exam", mark: "exam" },
  { href: "/dashboard", label: "Progress", mark: "progress" },
  { href: "/settings", label: "Settings", mark: "settings" },
];

/**
 * The Civic Studio shell: a dimensional left rail from `lg` up, a labelled
 * bottom tab bar below it. The information architecture is unchanged — this is
 * a presentation layer over the same six routes and the same due count.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { progress } = useProgress();
  const due = dueCount(progress);

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-card px-3 py-5 lg:flex">
        <Link
          href="/home"
          className="mb-7 flex items-center gap-3 px-2 no-underline"
        >
          <DimensionalMark name="brand" size="md" />
          <span className="whitespace-nowrap font-serif text-[1.0625rem] italic text-foreground">
            {BRAND.name}
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <RailLink
              key={item.href}
              {...item}
              active={isActive(pathname, item.href)}
              badge={item.href === "/review" ? due : 0}
            />
          ))}
        </nav>

        <p className="mt-auto px-2 text-[0.75rem] leading-relaxed text-muted-foreground">
          Independent educational product. Not affiliated with any certification
          body.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 px-5 py-6 pb-safe-nav sm:px-6 lg:px-10 lg:pb-14 lg:pt-10">
          <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        </main>
      </div>

      <MobileTabBar pathname={pathname} due={due} />
    </div>
  );
}

function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background pt-safe lg:hidden">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <DimensionalMark name="brand" size="sm" />
        <span className="font-serif text-[1.0625rem] italic text-foreground">
          {BRAND.name}
        </span>
      </div>
    </header>
  );
}

function MobileTabBar({ pathname, due }: { pathname: string; due: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-safe lg:hidden">
      {/* One column per entry, derived from the array. A hardcoded count
          silently wraps to a second row when a route is added, doubling the
          bar's height and burying whatever sits above it. */}
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
                "relative flex min-h-[3.75rem] min-w-0 flex-col items-center justify-center gap-1",
                "px-0.5 py-2 text-center text-[0.6875rem] font-medium no-underline",
                "transition-colors duration-[120ms]",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {/* The periwinkle edge marks the current route. It is paired with
                  a filled mark and a weight change, so the state survives
                  greyscale. */}
              {active ? (
                <span
                  aria-hidden
                  className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-accent"
                />
              ) : null}

              <span className="relative">
                <DimensionalMark
                  name={item.mark}
                  size="sm"
                  tone={active ? "accent" : "plain"}
                />
                {item.href === "/review" && due > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] font-semibold text-destructive-foreground">
                    {due > 99 ? "99+" : due}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function RailLink({
  href,
  label,
  mark,
  active,
  badge,
}: {
  href: string;
  label: string;
  mark: MarkName;
  active: boolean;
  badge: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-11 items-center gap-3 rounded-md py-2 pl-3 pr-2.5",
        "text-[0.9375rem] no-underline transition-colors duration-[120ms]",
        active
          ? "bg-accent-tint font-medium text-foreground"
          : "font-normal text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-accent"
        />
      ) : null}
      <DimensionalMark
        name={mark}
        size="sm"
        tone={active ? "accent" : "plain"}
      />
      {label}
      {badge > 0 ? (
        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[0.6875rem] font-semibold text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
