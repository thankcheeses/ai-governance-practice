import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  MAX_BODY,
  MAX_CONTACT,
  MIN_BODY,
  REPORT_KINDS,
  REPORT_STATUSES,
  safePage,
  tally,
  triageOrder,
  validateReport,
  type StoredReport,
} from "./reports";

/**
 * Two kinds of assertion here.
 *
 * The first kind checks the client rules. The second, and more important,
 * checks that those rules still match the SQL — the bounds exist twice by
 * necessity (once for the message, once for the guarantee) and the failure
 * mode is that someone edits one of them.
 */

const SQL = readFileSync(
  new URL("../../supabase/migrations/0008_reports_and_account_counts.sql", import.meta.url),
  "utf8",
);

/**
 * The same file with comments stripped.
 *
 * Structural assertions run against this rather than `SQL`, because the first
 * version of the "no user_id column" test failed on the comment that explains
 * why there is no user_id column. A test that reads prose is not checking the
 * schema, and it would have gone on passing if a real column were added while
 * the comment was deleted.
 */
const CODE = SQL.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\n]*/g, "");

/* -------------------------------------------------- SQL stays in agreement -- */

test("the body bounds match the database constraint", () => {
  assert.match(
    CODE,
    new RegExp(`length\\(btrim\\(body\\)\\) between ${MIN_BODY} and ${MAX_BODY}`),
    `SQL body bounds no longer match MIN_BODY=${MIN_BODY} / MAX_BODY=${MAX_BODY}`,
  );
});

test("the contact ceiling matches the database constraint", () => {
  assert.match(CODE, new RegExp(`length\\(contact\\) between \\d+ and ${MAX_CONTACT}`));
});

test("every kind the client offers is accepted by the database", () => {
  const constraint = /kind in \(([^)]*)\)/.exec(CODE);
  assert.ok(constraint, "no kind check constraint found");
  const allowed = [...constraint[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual([...REPORT_KINDS].sort(), allowed.sort());
});

test("every status the UI can set is accepted by the database", () => {
  const constraint = /status in \(([^)]*)\)/.exec(CODE);
  assert.ok(constraint);
  const allowed = [...constraint[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual([...REPORT_STATUSES].sort(), allowed.sort());
});

/* ------------------------------------------- the table is not left readable -- */

test("reports are readable only by admins, and anyone may file one", () => {
  // The whole design rests on this asymmetry. If the select policy ever widens,
  // other people's problem reports — and any reply address in them — become
  // public, which is a far worse failure than the feature not working.
  assert.match(CODE, /for insert to anon, authenticated with check \(true\)/);
  assert.match(
    CODE,
    /for select to authenticated using \(\s*exists \(select 1 from telemetry\.admins/,
    "the select policy no longer requires admin membership",
  );
});

test("a report carries no user_id", () => {
  // Studying needs no account, so reporting must not either. A silently
  // attached identity would make this a different transaction than the one the
  // reporter agreed to.
  const table = CODE.slice(CODE.indexOf("create table if not exists public.reports"));
  const body = table.slice(0, table.indexOf(");"));
  assert.ok(!/user_id/.test(body), "public.reports grew a user_id column");
  assert.ok(!/auth\.users/.test(body), "public.reports now references auth.users");
});

test("the account-count function checks admin membership inside itself", () => {
  // `security definer` means it reads public.profiles with RLS bypassed. The
  // guard is the only thing standing between that and an open door.
  const fn = CODE.slice(CODE.indexOf("create or replace function telemetry.account_counts"));
  assert.match(fn, /security definer/);
  assert.match(
    fn,
    /if not exists \(\s*select 1 from telemetry\.admins/,
    "the security-definer function no longer gates on admin membership",
  );
  assert.match(fn, /set search_path = ''/, "search_path is not pinned");
});

test("the account-count function returns counts, never rows per person", () => {
  const fn = CODE.slice(CODE.indexOf("create or replace function telemetry.account_counts"));
  const signature = fn.slice(0, fn.indexOf("language plpgsql"));
  // Every returned column is a bigint tally. An email or an id appearing here
  // would turn counts into a roster, which is the thing that was ruled out.
  for (const forbidden of [/email/i, /display_name/i, /\bid\b/]) {
    assert.doesNotMatch(signature, forbidden, `account_counts returns ${forbidden}`);
  }
  assert.equal((signature.match(/bigint/g) ?? []).length, 5);
});

/* ------------------------------------------------------------ validation -- */

test("a report has to actually say something", () => {
  const r = validateReport({ kind: "bug", body: "broken" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.field, "body");
});

test("whitespace is not a description", () => {
  // The SQL floor applies to btrim(body), so the client floor must too —
  // otherwise this passes here and is rejected by the server.
  const r = validateReport({ kind: "bug", body: " ".repeat(MIN_BODY + 5) });
  assert.equal(r.ok, false);
});

test("the body floor is exact", () => {
  assert.equal(validateReport({ kind: "bug", body: "x".repeat(MIN_BODY - 1) }).ok, false);
  assert.equal(validateReport({ kind: "bug", body: "x".repeat(MIN_BODY) }).ok, true);
});

test("the body ceiling is exact", () => {
  assert.equal(validateReport({ kind: "bug", body: "x".repeat(MAX_BODY) }).ok, true);
  assert.equal(validateReport({ kind: "bug", body: "x".repeat(MAX_BODY + 1) }).ok, false);
});

test("an unknown kind is refused rather than coerced", () => {
  const r = validateReport({ kind: "urgent", body: "The timer keeps resetting." });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.field, "kind");
});

test("contact is optional, and blank means blank", () => {
  for (const contact of [undefined, "", "   "]) {
    const r = validateReport({ kind: "bug", body: "The timer keeps resetting.", contact });
    assert.equal(r.ok, true, `rejected a blank contact: ${JSON.stringify(contact)}`);
    if (r.ok) assert.equal(r.value.contact, null);
  }
});

test("an obviously malformed address is caught, a normal one is not", () => {
  assert.equal(
    validateReport({ kind: "bug", body: "The timer keeps resetting.", contact: "nope" }).ok,
    false,
  );
  const good = validateReport({
    kind: "bug",
    body: "The timer keeps resetting.",
    contact: "someone@example.org",
  });
  assert.equal(good.ok, true);
  if (good.ok) assert.equal(good.value.contact, "someone@example.org");
});

/* ------------------------------------------------------------- safePage -- */

test("a query string never reaches storage", () => {
  // "Which screen" does not need parameters, and parameters are where
  // identifiers hide.
  assert.equal(safePage("/study/session?focus=1&uid=abc"), "/study/session");
  assert.equal(safePage("/review#card-3"), "/review");
});

test("something that is not a path becomes null rather than being stored raw", () => {
  assert.equal(safePage("https://example.com/evil"), null);
  assert.equal(safePage("javascript:alert(1)"), null);
  assert.equal(safePage(undefined), null);
  assert.equal(safePage(""), null);
});

/* --------------------------------------------------------------- triage -- */

function stored(id: string, status: StoredReport["status"], createdAt: string): StoredReport {
  return { id, status, createdAt, kind: "bug", body: "x".repeat(MIN_BODY), contact: null, page: null };
}

test("unresolved reports sort above resolved ones, whatever their age", () => {
  // A date-only sort buries an unanswered two-week-old bug under today's
  // noise, which is exactly what an inbox is for preventing.
  const ordered = triageOrder([
    stored("closed-today", "closed", "2026-09-29T00:00:00.000Z"),
    stored("new-old", "new", "2026-09-01T00:00:00.000Z"),
    stored("ack-yesterday", "acknowledged", "2026-09-28T00:00:00.000Z"),
  ]);
  assert.deepEqual(ordered.map((r) => r.id), ["new-old", "ack-yesterday", "closed-today"]);
});

test("within a status, newest first", () => {
  const ordered = triageOrder([
    stored("older", "new", "2026-09-01T00:00:00.000Z"),
    stored("newer", "new", "2026-09-28T00:00:00.000Z"),
  ]);
  assert.deepEqual(ordered.map((r) => r.id), ["newer", "older"]);
});

test("triageOrder does not mutate its input", () => {
  const input = [
    stored("closed", "closed", "2026-09-29T00:00:00.000Z"),
    stored("new", "new", "2026-09-01T00:00:00.000Z"),
  ];
  triageOrder(input);
  assert.deepEqual(input.map((r) => r.id), ["closed", "new"]);
});

test("the tally counts each status separately", () => {
  const t = tally([
    stored("a", "new", "2026-09-29T00:00:00.000Z"),
    stored("b", "new", "2026-09-28T00:00:00.000Z"),
    stored("c", "closed", "2026-09-27T00:00:00.000Z"),
  ]);
  assert.deepEqual(t, { new: 2, acknowledged: 0, closed: 1 });
});

test("an empty inbox tallies to zeroes rather than throwing", () => {
  assert.deepEqual(tally([]), { new: 0, acknowledged: 0, closed: 0 });
});
