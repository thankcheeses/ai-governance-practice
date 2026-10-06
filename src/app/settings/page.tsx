"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { Disclaimer } from "@/components/app/disclaimer";
import { StarButton } from "@/components/civic/star-button";
import { isStarConfigured } from "@/lib/github/stars";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTrack } from "@/content/registry";
import { BRAND, COMPANY, SUPPORT } from "@/lib/brand";
import { useProgress } from "@/lib/store/progress-provider";
import { useTheme, type Theme } from "@/lib/store/theme-provider";
import { setSoundEnabled, soundEnabled } from "@/lib/sound";
import { hasOptedOut, setOptedOut } from "@/lib/telemetry";
import { cn } from "@/lib/utils";

const THEMES: { value: Theme; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

const DAILY_GOAL_MIN = 5;
const DAILY_GOAL_MAX = 50;

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
    deleteAccount,
  } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [dailyGoalDraft, setDailyGoalDraft] = useState(String(progress.dailyGoal));
  const track = getTrack(progress.trackId);

  useEffect(() => {
    setDailyGoalDraft(String(progress.dailyGoal));
  }, [progress.dailyGoal]);

  return (
    <div className="space-y-7">
      <header>
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
          Preferences
        </p>
        <h1 className="text-[2rem] leading-[1.15] sm:text-[2.25rem]">Settings</h1>
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
                "flex min-h-11 flex-col items-center justify-center gap-2 rounded-md border bg-card p-3.5 text-sm transition-colors",
                theme === option.value
                  ? "border-accent bg-accent-tint font-medium text-accent-foreground ring-1 ring-inset ring-accent"
                  : "border-border text-muted-foreground hover:bg-secondary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Study */}
      <Section title="Study">
        <div>
          <p className="measure mb-2.5 text-sm text-muted-foreground">
            Daily goal — questions per day
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={DAILY_GOAL_MIN}
                max={DAILY_GOAL_MAX}
                step={1}
                value={progress.dailyGoal}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setDailyGoal(next);
                  setDailyGoalDraft(String(next));
                }}
                aria-label="Daily goal — questions per day"
                className="min-w-0 flex-1 accent-accent"
              />
              <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">
                {DAILY_GOAL_MIN}–{DAILY_GOAL_MAX}
              </span>
            </div>

            <label className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Questions</span>
              <input
                type="number"
                inputMode="numeric"
                min={DAILY_GOAL_MIN}
                max={DAILY_GOAL_MAX}
                step={1}
                value={dailyGoalDraft}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDailyGoalDraft(raw);
                  if (raw === "") return;
                  const next = Number(raw);
                  if (Number.isInteger(next) && next >= DAILY_GOAL_MIN && next <= DAILY_GOAL_MAX) {
                    setDailyGoal(next);
                  }
                }}
                onBlur={() => {
                  const next = Number(dailyGoalDraft);
                  if (!dailyGoalDraft || !Number.isInteger(next)) {
                    setDailyGoalDraft(String(progress.dailyGoal));
                    return;
                  }
                  const clamped = Math.min(DAILY_GOAL_MAX, Math.max(DAILY_GOAL_MIN, next));
                  setDailyGoal(clamped);
                  setDailyGoalDraft(String(clamped));
                }}
                aria-label="Daily goal — questions per day"
                placeholder="5"
                className="h-11 w-24 rounded-md border border-input bg-card px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Choose any whole number from {DAILY_GOAL_MIN} to {DAILY_GOAL_MAX}. 50 is the cap so a daily goal stays useful for practice metrics without turning into a full-bank grind.
          </p>
        </div>

        <Separator className="my-4" />

        <Row label="Active track" value={track.name} />
        <Row label="Access" value="Everything, free" />
      </Section>

      {/* Account */}
      <Section title="Account">
        {!authEnabled ? (
          <p className="measure text-sm leading-relaxed text-muted-foreground">
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
              Sign out
            </Button>

            <Separator className="my-5" />

            <h3 className="text-sm font-medium">Delete account</h3>
            <p className="measure mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Permanently deletes your account and everything stored with it —
              answers, review schedule, and settings. This cannot be undone and
              is not the same as signing out.
            </p>

            {deleteError ? (
              <p
                role="alert"
                className="mt-3 border border-l-4 border-destructive bg-destructive-tint p-3 text-sm text-destructive"
              >
                {deleteError}
              </p>
            ) : null}

            {confirmDelete ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="destructive"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    setDeleteError(null);
                    try {
                      await deleteAccount();
                      setConfirmDelete(false);
                    } catch (err) {
                      setDeleteError(
                        err instanceof Error
                          ? err.message
                          : "Could not delete your account.",
                      );
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting
                    ? "Deleting your account…"
                    : "Yes, delete my account permanently"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={deleting}
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeleteError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="mt-4 w-full sm:w-auto"
                onClick={() => setConfirmDelete(true)}
              >
                Delete account
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="measure text-sm leading-relaxed text-muted-foreground">
              You are studying without an account. Progress is saved in this
              browser. Sign in to sync across devices.
            </p>
            <Button asChild className="mt-4 w-full sm:w-auto">
              <Link href="/login">Sign in or create account</Link>
            </Button>
          </>
        )}
      </Section>

      {isStarConfigured() ? (
        <Section title="Back this project">
          <p className="measure mb-4 text-sm leading-relaxed text-muted-foreground">
            The app is free and has no analytics, so a star is the only signal
            that any of this is useful to anyone.
          </p>
          <StarButton />
        </Section>
      ) : null}

      <Section title="Support">
        <div className="flex items-start gap-3">
          <div className="min-w-0">
            <p className="measure text-sm leading-relaxed text-muted-foreground">
              Questions about the app, your account, or the content.
            </p>
            <a
              href={`mailto:${SUPPORT.email}`}
              className="mt-1.5 inline-block break-all text-sm font-medium text-link underline decoration-link/40 underline-offset-4 transition-colors hover:text-link-hover hover:decoration-link-hover"
            >
              {SUPPORT.email}
            </a>
          </div>
        </div>
      </Section>

      <Section title="Sound">
        <SoundToggle />
        <p className="measure mt-3 text-xs leading-relaxed text-muted-foreground">
          Off by default, and off until you turn it on here. The only cue is a
          short one when you finish a sitting with every question right.
        </p>
      </Section>

      {/*
        Privacy sits above Legal and is a control, not a link.

        An opt-out a learner has to go and find in a policy document is an
        opt-out in name only. This is the switch itself, in the settings screen,
        with the scope of what is collected stated next to it rather than a page
        away — so the choice can be made where it is offered.
      */}
      <Section title="Privacy">
        <TelemetryToggle />
        <div className="measure mt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Collected</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Which kind of session you started</li>
              <li>The Body of Knowledge domain and sub-domain of a question</li>
              <li>Whether the answer was correct</li>
              <li>A random device id that is replaced every 90 days</li>
              <li>
                Inferred from the connection rather than sent by the app: country
                (and, in the US, state), and device, browser and operating system
                family
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground">Not collected</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              <li>Your account, your identity, or your email address</li>
              <li>Which question you saw, or which option you chose</li>
              <li>
                Your IP address — used for a moment to derive the country, then
                discarded, with no field in the database to store it
              </li>
            </ul>
          </div>
          {/*
            The honest word, stated where the choice is made.

            Earlier copy here said "anonymous" and "never linked to you". Both
            over-claimed: a rotating device id is sent with every event, and its
            whole purpose is to link events from one device across sessions. The
            claim that survives contact with the code is the narrower one — not
            joined to an account — so that is the one made.
          */}
          <p>
            Because that device id is included, this is{" "}
            <strong className="font-medium text-foreground">pseudonymous rather than anonymous</strong>:
            events from one device can be grouped together for up to 90 days.
            They are not joined to your account, and signed in or signed out
            produces the same record. Off means nothing is sent at all.{" "}
            <Link href="/settings/privacy" className="underline underline-offset-2">
              Full policy
            </Link>
            .
          </p>
        </div>
      </Section>

      <Section title="Legal">
        <Disclaimer />
        <div className="mt-3 space-y-2">
          <LinkRow href="/settings/privacy" label="Privacy Policy" />
          <LinkRow href="/settings/terms" label="Terms of Use" />
        </div>
      </Section>

      <Section title={`About ${BRAND.name}`}>
        <p className="measure text-sm leading-relaxed text-muted-foreground">
          {BRAND.category} {BRAND.positioning}
        </p>
        <div className="mt-4 space-y-1">
          <Row label="Tagline" value={BRAND.tagline} />
          <Row label="Track" value={`${track.name} · ${track.questionCount} questions`} />
          <Row label="Version" value="1.0.0-beta" />
          <Row label="Published by" value={COMPANY.name} />
        </div>
      </Section>

      <Section title="Data">
        <p className="measure text-sm leading-relaxed text-muted-foreground">
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
      <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h2>
      <Card>
        <CardContent className="p-5">{children}</CardContent>
      </Card>
    </section>
  );
}

/**
 * The usage-measurement opt-out.
 *
 * Reads and writes localStorage directly rather than going through the
 * progress store: this is a device preference, not learning progress, and it
 * must keep working for a signed-out visitor whose progress never syncs.
 *
 * Mounted state is tracked because the stored value is unavailable during
 * server render and the first client paint — rendering "on" before reading the
 * flag would flash the wrong state at someone who had opted out, which is the
 * one person for whom that flash is not acceptable.
 */
/**
 * Mirrors `TelemetryToggle` deliberately — same shape, same mounted-state
 * guard. The preference is read in an effect rather than during render because
 * it lives in localStorage, which does not exist on the server; reading it
 * inline would mismatch the static export's markup on hydration.
 */
function SoundToggle() {
  const [on, setOn] = useState<boolean | null>(null);

  useEffect(() => {
    setOn(soundEnabled());
  }, []);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">Sound cues</p>
        <p className="text-xs text-muted-foreground">
          {on === null ? "\u00a0" : on ? "On" : "Off — nothing plays"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on === true}
        aria-label="Sound cues"
        disabled={on === null}
        onClick={() => {
          const next = !on;
          setSoundEnabled(next);
          setOn(next);
        }}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-40",
          on ? "border-accent bg-accent" : "border-border bg-secondary",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform",
            on ? "translate-x-[1.4rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function TelemetryToggle() {
  const [optedOut, setOptedOutState] = useState<boolean | null>(null);

  useEffect(() => {
    setOptedOutState(hasOptedOut());
  }, []);

  const on = optedOut === false;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">Usage analytics</p>
        <p className="text-xs text-muted-foreground">
          {optedOut === null
            ? "\u00a0"
            : on
              ? "On — not linked to your account"
              : "Off — nothing is sent"}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Usage analytics"
        disabled={optedOut === null}
        onClick={() => {
          const next = !on;
          setOptedOut(!next);
          setOptedOutState(!next);
        }}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors disabled:opacity-40",
          on ? "border-accent bg-accent" : "border-border bg-secondary",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-card shadow-sm transition-transform",
            on ? "translate-x-[1.4rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
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
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-sm border border-border p-3.5 text-sm transition-colors hover:bg-secondary"
    >
      {label}
      <span aria-hidden className="ml-auto text-muted-foreground">&rsaquo;</span>
    </Link>
  );
}
