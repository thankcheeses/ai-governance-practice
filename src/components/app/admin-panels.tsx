"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  REPORT_STATUSES,
  KIND_LABELS,
  tally,
  triageOrder,
  type ReportStatus,
  type StoredReport,
} from "@/lib/reports";

/**
 * The two panels the usage dashboard was missing: how many accounts exist, and
 * what people have reported.
 *
 * Kept out of `admin/page.tsx` because that file is already one long component
 * reading one table, and because these two read different things with
 * different failure modes. Nothing here changes what the existing page shows.
 */

/* --------------------------------------------------------- account counts -- */

interface Counts {
  total: number;
  new_7d: number;
  new_30d: number;
  active_7d: number;
  active_30d: number;
}

/**
 * Counts of registered accounts. Never a roster.
 *
 * This calls `telemetry.account_counts()`, a `security definer` function that
 * checks admin membership internally and returns exactly one row of tallies.
 * There is no query here, and none available to this page, that returns a row
 * per person — that was a deliberate choice, not an omission, and
 * `reports.test.ts` asserts the function's signature stays all-bigint so it
 * cannot quietly grow an email column.
 *
 * It also cannot see anonymous use. Studying needs no account, so most usage
 * is not represented in these numbers at all; the caption says so rather than
 * letting "12 accounts" read as "12 users".
 */
export function AccountCounts() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "unconfigured" }
    | { status: "unavailable" }
    | { status: "error"; message: string }
    | { status: "ready"; counts: Counts }
  >({ status: "loading" });

  useEffect(() => {
    void (async () => {
      const supabase = getBrowserSupabase();
      if (!supabase) return setState({ status: "unconfigured" });

      const { data, error } = await supabase.schema("telemetry").rpc("account_counts");
      if (error) return setState({ status: "error", message: error.message });

      // A non-admin gets zero rows rather than an error, the same shape as an
      // RLS denial. "Unavailable" is the honest reading: it may mean no
      // accounts, or it may mean this account is not allowed to know.
      const row = Array.isArray(data) ? (data[0] as Counts | undefined) : undefined;
      if (!row) return setState({ status: "unavailable" });
      setState({ status: "ready", counts: row });
    })();
  }, []);

  // Silent when Supabase is absent: the page around this already explains
  // that, and a second copy of the same sentence is not more informative.
  if (state.status === "loading" || state.status === "unconfigured") return null;

  if (state.status === "error") {
    return (
      <Section title="Accounts">
        <Note>Could not read account counts: {state.message}</Note>
      </Section>
    );
  }

  if (state.status === "unavailable") {
    return (
      <Section title="Accounts">
        <Note>
          No account counts are visible. Either nobody has signed up yet, or
          this account is not in <code>telemetry.admins</code>.
        </Note>
      </Section>
    );
  }

  const { counts } = state;
  return (
    <Section title="Accounts">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total" value={counts.total} />
        <Stat label="New" value={counts.new_7d} hint="last 7 days" />
        <Stat label="New" value={counts.new_30d} hint="last 30 days" />
        <Stat label="Studied" value={counts.active_7d} hint="last 7 days" />
      </div>
      <p className="measure mt-3 text-xs leading-relaxed text-muted-foreground">
        Registered accounts only. Studying needs no account, so most use of the
        app is not counted here and cannot be — there is no identity in the
        telemetry to join to. These are counts by design: no roster, no emails,
        and no per-person view exists anywhere in this dashboard.
      </p>
    </Section>
  );
}

/* ----------------------------------------------------------- reports inbox -- */

interface Row {
  id: string;
  kind: string;
  body: string;
  contact: string | null;
  page: string | null;
  status: string;
  created_at: string;
}

function toStored(r: Row): StoredReport {
  return {
    id: r.id,
    kind: (r.kind as StoredReport["kind"]) ?? "other",
    body: r.body,
    contact: r.contact,
    page: r.page,
    status: (REPORT_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as ReportStatus)
      : "new",
    createdAt: r.created_at,
  };
}

export function ReportsInbox() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "unconfigured" }
    | { status: "unavailable" }
    | { status: "error"; message: string }
    | { status: "ready"; reports: StoredReport[] }
  >({ status: "loading" });
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return setState({ status: "unconfigured" });

    const { data, error } = await supabase
      .from("reports")
      .select("id,kind,body,contact,page,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return setState({ status: "error", message: error.message });
    if (!data) return setState({ status: "unavailable" });
    setState({ status: "ready", reports: triageOrder((data as Row[]).map(toStored)) });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: ReportStatus) {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    setSaving(id);
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    setSaving(null);
    if (error) return setState({ status: "error", message: error.message });
    await load();
  }

  // Silent when Supabase is absent: the page around this already explains
  // that, and a second copy of the same sentence is not more informative.
  if (state.status === "loading" || state.status === "unconfigured") return null;

  if (state.status === "error") {
    return (
      <Section title="Reported problems">
        <Note>Could not read reports: {state.message}</Note>
      </Section>
    );
  }

  if (state.status === "unavailable") {
    return (
      <Section title="Reported problems">
        <Note>
          Reports are not readable by this account. They are visible only to
          members of <code>telemetry.admins</code>.
        </Note>
      </Section>
    );
  }

  const { reports } = state;

  // An empty inbox is genuinely good news, and is not the same as a denial —
  // RLS would have returned nothing either way, so this says both.
  if (!reports.length) {
    return (
      <Section title="Reported problems">
        <Note>
          Nothing reported. If that seems unlikely, check that this account is
          in <code>telemetry.admins</code> — a non-admin sees an empty list
          rather than an error.
        </Note>
      </Section>
    );
  }

  const counts = tally(reports);
  return (
    <Section title="Reported problems">
      <p className="mb-3 text-sm text-muted-foreground">
        <strong className="font-medium text-foreground">{counts.new}</strong> new
        {", "}
        {counts.acknowledged} acknowledged, {counts.closed} closed. Unresolved
        first, then newest.
      </p>
      <ul className="space-y-3">
        {reports.map((r) => (
          <li key={r.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-[0.8125rem] font-medium">
                {KIND_LABELS[r.kind]}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {r.createdAt.slice(0, 10)}
                {r.page ? ` · ${r.page}` : ""}
              </span>
            </div>
            {/* whitespace-pre-wrap because a report is prose someone typed,
                and their line breaks carry meaning. */}
            <p className="measure mt-2 whitespace-pre-wrap text-sm leading-relaxed">
              {r.body}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {r.contact ? (
                <a href={`mailto:${r.contact}`} className="text-xs">
                  {r.contact}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">No reply address</span>
              )}
              <span className="flex-1" />
              {REPORT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void setStatus(r.id, s)}
                  disabled={saving === r.id || r.status === s}
                  aria-pressed={r.status === s}
                  className={`rounded-md border px-2 py-0.5 text-xs ${
                    r.status === s
                      ? "border-border-strong bg-secondary font-medium"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------------------------------------------------------------- shared -- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[0.8125rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="measure rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl tabular-nums">{value.toLocaleString()}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
