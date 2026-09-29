/**
 * Problem reports — the shape, and the rules for what counts as one.
 *
 * Pure so it can be tested in node, and so the bounds live in exactly one
 * place on this side of the wire. Every constant here has a twin `check`
 * constraint in `supabase/migrations/0008_reports_and_account_counts.sql`;
 * the pair is asserted in `reports.test.ts` by reading the SQL, because two
 * copies of a number drift the moment one of them is edited alone.
 *
 * The client validation exists to save a round trip and give a useful message,
 * not to protect the table. The database is what protects the table.
 */

/** What kind of problem. Kept short: a long menu is a worse form. */
export const REPORT_KINDS = ["bug", "content", "accessibility", "other"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

/** Human labels. Plain words — nobody reporting a broken question says "kind". */
export const KIND_LABELS: Record<ReportKind, string> = {
  bug: "Something is broken",
  content: "A question or explanation looks wrong",
  accessibility: "Hard to use with assistive technology",
  other: "Something else",
};

export const MIN_BODY = 10;
export const MAX_BODY = 4000;
export const MAX_CONTACT = 320;
export const MIN_CONTACT = 3;
export const MAX_PAGE = 200;

export interface ReportDraft {
  kind: string;
  body: string;
  /** Optional. Empty string and whitespace both mean "no reply wanted". */
  contact?: string;
  page?: string;
}

export interface Report {
  kind: ReportKind;
  body: string;
  contact: string | null;
  page: string | null;
}

export type Validation =
  | { ok: true; value: Report }
  | { ok: false; field: "kind" | "body" | "contact"; message: string };

function isKind(value: string): value is ReportKind {
  return (REPORT_KINDS as readonly string[]).includes(value);
}

/**
 * Reduce a path to something safe to store.
 *
 * Path only, query string and fragment dropped. A query string is where
 * identifiers end up, and "which screen were you on" does not need them. A
 * value that is not a path at all becomes null rather than being stored as
 * whatever it was.
 */
export function safePage(raw: string | undefined): string | null {
  if (!raw) return null;
  const path = raw.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/")) return null;
  return path.slice(0, MAX_PAGE) || null;
}

/**
 * Validate a draft, mirroring the database constraints.
 *
 * Note `btrim` in the SQL: the length floor is applied to the trimmed body
 * there, so it is applied to the trimmed body here too. Otherwise eleven
 * spaces would pass the client and be rejected by the server, which is the
 * worst of both.
 */
export function validateReport(draft: ReportDraft): Validation {
  if (!isKind(draft.kind)) {
    return { ok: false, field: "kind", message: "Choose what kind of problem this is." };
  }

  const body = draft.body.trim();
  if (body.length < MIN_BODY) {
    return {
      ok: false,
      field: "body",
      message: `Please describe the problem in at least ${MIN_BODY} characters.`,
    };
  }
  if (body.length > MAX_BODY) {
    return {
      ok: false,
      field: "body",
      message: `That is longer than ${MAX_BODY.toLocaleString()} characters. Please trim it.`,
    };
  }

  const typed = (draft.contact ?? "").trim();
  let contact: string | null = null;
  if (typed) {
    // Shape only. An address is proven by replying to it, never by a regex, so
    // this rejects the obviously-not-an-address and lets everything else pass.
    const shaped = typed.length >= MIN_CONTACT && /^[^\s@]+@[^\s@]+$/.test(typed);
    if (!shaped || typed.length > MAX_CONTACT) {
      return {
        ok: false,
        field: "contact",
        message: "That does not look like an email address. Leave it blank if you would rather not say.",
      };
    }
    contact = typed;
  }

  return { ok: true, value: { kind: draft.kind, body, contact, page: safePage(draft.page) } };
}

/* --------------------------------------------------------------- triage -- */

export const REPORT_STATUSES = ["new", "acknowledged", "closed"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface StoredReport extends Report {
  id: string;
  status: ReportStatus;
  createdAt: string;
}

/**
 * Newest first, but unresolved before resolved.
 *
 * An inbox sorted purely by date buries a two-week-old bug nobody answered
 * under today's noise, which is the failure mode an inbox is supposed to
 * prevent.
 */
const STATUS_RANK: Record<ReportStatus, number> = {
  new: 0,
  acknowledged: 1,
  closed: 2,
};

export function triageOrder(reports: readonly StoredReport[]): StoredReport[] {
  return [...reports].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      b.createdAt.localeCompare(a.createdAt),
  );
}

export interface ReportTally {
  new: number;
  acknowledged: number;
  closed: number;
}

export function tally(reports: readonly StoredReport[]): ReportTally {
  const counts: ReportTally = { new: 0, acknowledged: 0, closed: 0 };
  for (const r of reports) counts[r.status]++;
  return counts;
}
