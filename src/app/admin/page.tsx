"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

/**
 * Usage dashboard.
 *
 * ## The route is not the control
 *
 * `/admin` is a plain static page like every other route here — the export is
 * served by GitHub Pages, so anyone can load it. That is fine, and it is why
 * the gate is in the database rather than in this file: every read goes
 * through RLS on `telemetry.daily`, which requires a row in
 * `telemetry.admins`. A visitor who is not an admin gets an empty result, the
 * same as an anonymous one. Nothing here is protected by being hard to guess,
 * and nothing in this bundle is worth stealing.
 *
 * ## It reads rollups, never events
 *
 * `telemetry.events` has RLS enabled and **no policy at all**, so no browser
 * role can read it under any circumstances — including this one. The dashboard
 * can only ever see daily aggregates. That is a deliberate ceiling: an
 * individual-event browser is what turns usage measurement into surveillance,
 * and the useful metrics are not known well enough yet to justify building one.
 *
 * ## Numbers are labelled for what they are
 *
 * "Visitors" counts rotating identifiers that reset every 90 days, so a
 * returning learner is eventually counted twice. The page says so rather than
 * implying a precision the design deliberately gave up.
 */

interface Row {
  day: string;
  metric: string;
  dimension: string;
  value: number;
}

type State =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "denied" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: Row[] };

const WINDOW_DAYS = 30;

export default function AdminPage() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return setState({ status: "unconfigured" });

    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const { data, error } = await supabase
      .schema("telemetry")
      .from("daily")
      .select("day,metric,dimension,value")
      .gte("day", since)
      .order("day", { ascending: false });

    if (error) return setState({ status: "error", message: error.message });
    // RLS returns an empty set rather than an error to a non-admin, so "no
    // rows at all" is indistinguishable from "not an admin". Saying so is more
    // honest than showing a dashboard of zeroes to someone who simply is not
    // allowed to see it.
    if (!data?.length) return setState({ status: "denied" });
    setState({ status: "ready", rows: data as Row[] });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") return <Shell><p className="text-sm text-muted-foreground">Loading…</p></Shell>;

  if (state.status === "unconfigured") {
    return (
      <Shell>
        <Note>
          Supabase is not configured in this build, so there is nothing to read.
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and redeploy.
        </Note>
      </Shell>
    );
  }

  if (state.status === "error") {
    return <Shell><Note>Could not load usage data: {state.message}</Note></Shell>;
  }

  if (state.status === "denied") {
    return (
      <Shell>
        <Note>
          No usage data is visible to this account. Either none has been
          collected yet, or this account is not in <code>telemetry.admins</code>.
        </Note>
      </Shell>
    );
  }

  const { rows } = state;
  const sum = (metric: string) =>
    rows.filter((r) => r.metric === metric).reduce((n, r) => n + Number(r.value), 0);
  const byDimension = (metric: string) => {
    const m = new Map<string, number>();
    for (const r of rows.filter((x) => x.metric === metric)) {
      m.set(r.dimension, (m.get(r.dimension) ?? 0) + Number(r.value));
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const eventCount = (name: string) =>
    rows
      .filter((r) => r.metric === "events" && r.dimension === name)
      .reduce((n, r) => n + Number(r.value), 0);

  const examStarted = eventCount("exam_started");
  const examCompleted = eventCount("exam_completed");

  return (
    <Shell>
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Visitors" value={sum("dau")} hint={`${WINDOW_DAYS}-day total`} />
        <Stat label="Sessions" value={sum("sessions")} hint={`${WINDOW_DAYS}-day total`} />
        <Stat label="Questions answered" value={eventCount("question_answered")} />
        <Stat
          label="Exam completion"
          value={examStarted ? Math.round((examCompleted / examStarted) * 100) : 0}
          suffix="%"
          hint={`${examCompleted} of ${examStarted}`}
        />
      </section>

      <Table title="Accuracy by domain" rows={accuracyRows(rows, "domain")} />
      <Table title="Accuracy by sub-domain" rows={accuracyRows(rows, "subdomain")} />
      <Table
        title="Country"
        rows={byDimension("country").map(([k, v]) => [k, String(v)])}
      />
      <Table
        title="US states"
        rows={byDimension("region").map(([k, v]) => [k, String(v)])}
      />
      <Table
        title="Device"
        rows={byDimension("device").map(([k, v]) => [k, String(v)])}
      />
      <Table
        title="Referrer"
        rows={byDimension("referrer").map(([k, v]) => [k, String(v)])}
      />

      <p className="measure mt-10 text-xs leading-relaxed text-muted-foreground">
        Visitor counts use an identifier that resets every 90 days, so someone
        returning after that is counted again — these are approximate and
        deliberately so. Only daily aggregates are readable; individual events
        are not exposed to any account, including this one, and are deleted
        after 90 days.
      </p>
    </Shell>
  );
}

/** answered/correct pairs are stored separately so the ratio is computed here. */
function accuracyRows(rows: Row[], kind: "domain" | "subdomain"): [string, string][] {
  const answered = new Map<string, number>();
  const correct = new Map<string, number>();
  for (const r of rows) {
    if (r.metric === `answered_${kind}`) {
      answered.set(r.dimension, (answered.get(r.dimension) ?? 0) + Number(r.value));
    }
    if (r.metric === `correct_${kind}`) {
      correct.set(r.dimension, (correct.get(r.dimension) ?? 0) + Number(r.value));
    }
  }
  return [...answered.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, total]) => [
      k,
      `${Math.round(((correct.get(k) ?? 0) / total) * 100)}%  (${total})`,
    ]);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 pb-16">
      <header className="mb-8">
        <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Internal
        </p>
        <h1 className="text-[1.875rem] leading-[1.15]">Usage</h1>
      </header>
      {children}
    </main>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="measure rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl tabular-nums">
        {value.toLocaleString()}
        {suffix}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Table({ title, rows }: { title: string; rows: [string, string][] }) {
  if (!rows.length) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h2>
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
            <span className="min-w-0 truncate">{k}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{v}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
