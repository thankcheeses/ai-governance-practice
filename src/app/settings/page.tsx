"use client";

import {
  ChevronRight,
  FileText,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { Disclaimer } from "@/components/app/disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTrack } from "@/content/registry";
import { BRAND } from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";
import { useTheme, type Theme } from "@/lib/store/theme-provider";
import { cn } from "@/lib/utils";

const THEMES: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

const GOALS = [5, 10, 20, 30];

export default function SettingsPage() {
  return (
    <AppGate>
      <Settings />
    </AppGate>
  );
}

function Settings() {
  const { theme, setTheme } = useTheme();
  const {
    progress,
    user,
    authEnabled,
    signOut,
    setDailyGoal,
    resetProgress,
  } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const track = getTrack(progress.trackId);

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </header>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={theme === option.value}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3.5 text-sm transition-colors",
                theme === option.value
                  ? "border-accent bg-accent-subtle text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent-tint",
              )}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Study */}
      <Section title="Study">
        <div>
          <p className="mb-2.5 text-sm text-muted-foreground">
            Daily goal — scenarios per day
          </p>
          <div className="grid grid-cols-4 gap-2">
            {GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setDailyGoal(goal)}
                aria-pressed={progress.dailyGoal === goal}
                className={cn(
                  "rounded-lg border py-2.5 text-sm tabular-nums transition-colors",
                  progress.dailyGoal === goal
                    ? "border-accent bg-accent-subtle text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent-tint",
                )}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        <Row label="Active track" value={track.name} />
        <Row
          label="Plan"
          value={progress.tier === "pro" ? "Pro" : "Free"}
          action={
            progress.tier === "free" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/upgrade">Upgrade</Link>
              </Button>
            ) : null
          }
        />
      </Section>

      {/* Account */}
      <Section title="Account">
        {!authEnabled ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Accounts are not configured for this deployment. Progress is stored
            in this browser only. Add Supabase credentials to enable sign-in and
            cross-device sync.
          </p>
        ) : user ? (
          <>
            <Row label="Signed in as" value={user.email ?? "Account"} />
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={() => void signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You are studying without an account. Progress is saved in this
              browser. Sign in to sync across devices.
            </p>
            <Button asChild className="mt-4 w-full sm:w-auto">
              <Link href="/login">Sign in or create account</Link>
            </Button>
          </>
        )}
      </Section>

      {/* Legal */}
      <Section title="Legal">
        <Disclaimer />
        <div className="mt-3 space-y-2">
          <LinkRow href="/settings/privacy" icon={Shield} label="Privacy Policy" />
          <LinkRow href="/settings/terms" icon={FileText} label="Terms of Use" />
        </div>
      </Section>

      {/* About */}
      <Section title={`About ${BRAND.name}`}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {BRAND.category} {BRAND.positioning}
        </p>
        <div className="mt-4 space-y-1">
          <Row label="Tagline" value={BRAND.tagline} />
          <Row label="Track" value={`${track.name} · ${track.questionCount} scenarios`} />
          <Row label="Version" value="1.0.0 (MVP)" />
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="Data">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Clears every answer and review schedule. Your settings and plan are
          kept. This cannot be undone.
        </p>
        {confirmReset ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="destructive"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            >
              Yes, reset my progress
            </Button>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="mt-4 w-full sm:w-auto"
            onClick={() => setConfirmReset(true)}
          >
            <Trash2 className="h-4 w-4" />
            Reset progress
          </Button>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <Card>
        <CardContent className="p-5">{children}</CardContent>
      </Card>
    </section>
  );
}

function Row({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3 text-sm font-medium">
        {value}
        {action}
      </span>
    </div>
  );
}

function LinkRow({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border p-3.5 text-sm transition-colors hover:bg-accent-tint"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
      <Badge variant="outline" className="ml-auto">
        Placeholder
      </Badge>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
