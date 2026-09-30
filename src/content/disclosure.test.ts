import assert from "node:assert/strict";
import { test } from "node:test";
import { PRIVACY_SECTIONS } from "./legal";

/**
 * The privacy policy has to keep up with the code.
 *
 * This is a product about AI governance. Shipping data collection that its own
 * published policy does not describe would not be a small process slip — it
 * would falsify the thing the product is for. Before telemetry existed the
 * policy said "No analytics or telemetry SDK is present in the app" and
 * "signed out, the app collects no personal data at all", and both sentences
 * became untrue the moment an event was sent.
 *
 * So the disclosure is asserted rather than remembered. These tests fail if
 * someone removes the disclosure while the telemetry module is still wired, or
 * reinstates a claim the code contradicts.
 */

const ALL = PRIVACY_SECTIONS.map((s) => `${s.heading}\n${s.body}`).join("\n\n");
const HEADINGS = PRIVACY_SECTIONS.map((s) => s.heading);

test("the policy discloses that usage is measured", () => {
  assert.ok(
    HEADINGS.some((h) => /usage measurement/i.test(h)),
    "no section describes usage measurement",
  );
});

test("the policy states the four things the measurement must never do", () => {
  // Each of these mirrors a guarantee enforced elsewhere in code: no account
  // link (telemetry.test.ts payload allowlist), no IP retained (no column
  // exists in 0007_telemetry.sql), separation from learning data (separate
  // schema, no foreign key), and an opt-out that stops the request.
  for (const [claim, pattern] of [
    ["not linked to an account", /not linked to (any )?(an )?account|no account/i],
    ["IP address discarded", /ip address .*(discard|never)|never written/i],
    ["separate from learning data", /stored separately|cannot be combined/i],
    ["can be switched off", /switch(ed)? it off|turning usage measurement off/i],
  ] as const) {
    assert.match(ALL, pattern, `policy does not state: ${claim}`);
  }
});

test("the policy no longer claims no telemetry exists", () => {
  // The exact sentence that became false. Asserting on it by shape rather than
  // by memory, so a reinstated variant is caught too.
  assert.ok(
    !/no analytics or telemetry sdk is present/i.test(ALL),
    "the policy still claims no telemetry is present",
  );
  assert.ok(
    !/collects no personal data at all/i.test(ALL),
    "the policy still claims nothing at all is collected when signed out",
  );
});

test("the policy still refuses the things that are genuinely refused", () => {
  // Broadening the disclosure must not have quietly dropped the commitments
  // that remain true.
  for (const [claim, pattern] of [
    ["no third-party advertising/analytics SDK", /no third-party analytics or advertising sdk/i],
    ["no fingerprinting", /fingerprint/i],
    ["no precise location", /precise or gps location|no location/i],
    ["no sale or sharing", /do not sell or share/i],
    ["not used for model training", /train(ing)? machine learning models/i],
  ] as const) {
    assert.match(ALL, pattern, `policy dropped: ${claim}`);
  }
});

test("the disclosure says where the switch is", () => {
  // A stated opt-out that does not say where to find it is not an opt-out.
  assert.match(ALL, /settings/i);
});

test("the policy discloses the problem-report form", () => {
  // The form collects free text and an optional email address — the two things
  // the telemetry sections explicitly promise NOT to collect. A reader who took
  // those sections as the whole picture would be misled, so reports need their
  // own disclosure rather than an assumption that "usage measurement" covers
  // them.
  assert.ok(
    HEADINGS.some((h) => /report a problem/i.test(h)),
    "no section describes the problem-report form",
  );
});

test("the report disclosure states what it does and does not carry", () => {
  for (const [claim, pattern] of [
    ["the email address is optional", /email address is optional|optional: give one/i],
    ["no account is required", /no account is needed to send/i],
    ["it is not linked to the account", /carries no user id|nothing is attached to your account/i],
    ["the query string is dropped", /never the query string|path only/i],
    ["only the operator can read it", /readable only by the operator/i],
  ] as const) {
    assert.match(ALL, pattern, `report disclosure does not state: ${claim}`);
  }
});

test("the policy does not promise reports are deleted on a schedule", () => {
  // 0008 has no delete policy and no retention job, on purpose — a report is
  // closed, not erased. Claiming a deletion schedule that no code implements
  // would be exactly the kind of untrue sentence the tests above exist to stop.
  const section = PRIVACY_SECTIONS.find((s) => /report a problem/i.test(s.heading));
  assert.ok(section, "the report section vanished");
  assert.match(
    section.body,
    /not deleted on a schedule/i,
    "the report section no longer says reports are kept rather than expired",
  );
});

/* ------------------------------------ the claim must not outrun the pipeline -- */

/**
 * The telemetry payload carries a device identifier by design:
 *
 *   VISITOR_KEY  = "agp:telemetry:visitor"
 *   VISITOR_TTL_MS = 90 days
 *   body: JSON.stringify({ event, visitorId: visitorId(), sessionId, ... })
 *
 * That identifier exists in order to link records from one device across
 * sessions — it is what makes "returning visitor" measurable. So the data is
 * pseudonymous, and calling it anonymous is a stronger claim than the code
 * supports. Earlier copy made exactly that claim, in three places.
 *
 * These tests exist because a claim boundary nobody enforces is a claim
 * boundary that drifts back.
 */

const USAGE = PRIVACY_SECTIONS.find((s) => /usage measurement/i.test(s.heading));

test("the usage section does not call pseudonymous data anonymous", () => {
  assert.ok(USAGE, "the usage-measurement section vanished");
  // Naming the distinction is allowed and wanted; asserting anonymity is not.
  assert.match(
    USAGE.heading + " " + USAGE.body,
    /pseudonymous/i,
    "the usage disclosure no longer says the data is pseudonymous",
  );
  assert.doesNotMatch(
    USAGE.heading,
    /\banonymous\b/i,
    "the usage-measurement heading claims anonymity again",
  );
});

test("the policy never claims the identifier cannot identify you", () => {
  // The precise sentence that was removed, plus the nearby phrasings that mean
  // the same thing. Matched by shape rather than by memory of the original.
  for (const overclaim of [
    /cannot be used to identify you/i,
    /can(not|'t) identify you/i,
    /never linked to you\b/i,
    /completely anonymous/i,
    /fully anonymous/i,
  ]) {
    assert.doesNotMatch(ALL, overclaim, `the policy over-claims again: ${overclaim}`);
  }
});

test("the rotating device identifier is disclosed, not glossed", () => {
  // If the identifier is the reason the data is only pseudonymous, then the
  // identifier has to appear in the disclosure. Otherwise the honest label is
  // unexplained and reads as hedging.
  assert.match(ALL, /replaced every 90 days|rotating device identifier/i);
  assert.match(
    ALL,
    /grouped together|across sessions/i,
    "the policy no longer says what the identifier makes possible",
  );
});

test("reports may still be called anonymous, because they carry no identifier", () => {
  // Worth asserting the contrast rather than banning the word outright:
  // public.reports has no user_id, no device id and no IP, so for reports the
  // word is accurate. Telemetry is the one that had to be corrected.
  const reports = PRIVACY_SECTIONS.find((s) => /report a problem/i.test(s.heading));
  assert.ok(reports, "the report section vanished");
  assert.match(reports.body, /anonymous/i);
});
