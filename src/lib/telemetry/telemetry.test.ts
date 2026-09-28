import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

/**
 * The contract under test is mostly negative: telemetry must be incapable of
 * breaking the thing it measures.
 *
 * Each case sabotages the environment in a way a real browser genuinely does —
 * storage that throws, a missing fetch, a rejecting network, an unconfigured
 * endpoint — and asserts that studying is unaffected, meaning `track` returns
 * normally and nothing propagates.
 *
 * The module reads its endpoint from the environment at import time, so each
 * test re-imports with a cache-busting query rather than trying to mutate a
 * frozen constant.
 */

const ENDPOINT = "https://example.test/functions/v1/collect";

interface FakeStore {
  store: Map<string, string>;
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

function installStorage(): FakeStore {
  const store = new Map<string, string>();
  const fake: FakeStore = {
    store,
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => void store.set(k, v),
    removeItem: (k) => void store.delete(k),
  };
  (globalThis as { localStorage?: unknown }).localStorage = fake;
  return fake;
}

let sent: unknown[] = [];

function installFetch(impl?: () => Promise<Response>) {
  sent = [];
  (globalThis as { fetch?: unknown }).fetch = (_url: string, init?: RequestInit) => {
    sent.push(init?.body ? JSON.parse(String(init.body)) : null);
    return impl ? impl() : Promise.resolve(new Response(null, { status: 204 }));
  };
}

/**
 * The module reads its endpoint per call, so a single import is enough and the
 * environment can be changed between tests. An earlier version of this helper
 * re-imported with a cache-busting query to force a fresh module; under tsx's
 * CJS output that silently returned the cached instance, so four of these
 * tests were asserting against an endpoint that was never set.
 */
async function loadTelemetry(endpoint: string | undefined) {
  if (endpoint) process.env.NEXT_PUBLIC_TELEMETRY_URL = endpoint;
  else delete process.env.NEXT_PUBLIC_TELEMETRY_URL;
  return import("./index");
}

beforeEach(() => {
  installStorage();
  installFetch();
});

test("an unconfigured endpoint sends nothing and does not throw", async () => {
  const t = await loadTelemetry(undefined);
  t.track("question_answered", { domain: "III", correct: true });
  assert.equal(sent.length, 0);
  assert.equal(t.isEnabled(), false);
});

test("a configured endpoint sends the event", async () => {
  const t = await loadTelemetry(ENDPOINT);
  t.track("question_answered", { domain: "III", subdomain: "III.B", correct: false });
  assert.equal(sent.length, 1);
  const body = sent[0] as Record<string, unknown>;
  assert.equal(body.event, "question_answered");
  assert.equal(body.domain, "III");
  assert.equal(body.correct, false);
});

test("the payload never carries learner identity or answer detail", async () => {
  const t = await loadTelemetry(ENDPOINT);
  t.track("question_answered", { domain: "II", subdomain: "II.C", correct: true });
  const body = sent[0] as Record<string, unknown>;
  const keys = Object.keys(body).sort();
  // An exact allowlist. A new field has to be added here deliberately, which
  // is the point: this is the test that would catch someone attaching a
  // questionId, a user id, or a score to an event.
  assert.deepEqual(keys, [
    "appVersion",
    "correct",
    "domain",
    "event",
    "sessionId",
    "subdomain",
    "visitorId",
  ]);
  for (const forbidden of ["userId", "user_id", "email", "questionId", "selected", "score"]) {
    assert.ok(!(forbidden in body), `payload leaked "${forbidden}"`);
  }
});

test("geography and device are never reported by the client", async () => {
  // They are derived at the edge from request metadata. A client that sent
  // them would be reporting its own location, which is the thing being avoided.
  const t = await loadTelemetry(ENDPOINT);
  t.track("session_start");
  const body = sent[0] as Record<string, unknown>;
  for (const k of ["country", "region", "device", "ip", "timezone", "userAgent"]) {
    assert.ok(!(k in body), `client reported "${k}"`);
  }
});

test("opting out stops sending immediately", async () => {
  const t = await loadTelemetry(ENDPOINT);
  t.track("page_view");
  assert.equal(sent.length, 1);

  t.setOptedOut(true);
  t.track("page_view");
  t.track("question_answered", { correct: true });
  assert.equal(sent.length, 1, "events were sent after opting out");
  assert.equal(t.isEnabled(), false);

  t.setOptedOut(false);
  t.track("page_view");
  assert.equal(sent.length, 2, "opting back in did not resume");
});

test("a rejecting network never surfaces an error", async () => {
  installFetch(() => Promise.reject(new Error("offline")));
  const t = await loadTelemetry(ENDPOINT);
  assert.doesNotThrow(() => t.track("study_completed"));
  // Give the rejected promise a turn to become unhandled if it were going to.
  await new Promise((r) => setTimeout(r, 0));
});

test("storage that throws degrades to no telemetry, not to an exception", async () => {
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem() {
      throw new Error("SecurityError: storage disabled");
    },
    setItem() {
      throw new Error("SecurityError: storage disabled");
    },
    removeItem() {
      throw new Error("SecurityError: storage disabled");
    },
  };
  const t = await loadTelemetry(ENDPOINT);
  assert.doesNotThrow(() => t.track("page_view"));
  assert.doesNotThrow(() => t.startSession());
});

test("a missing fetch is survivable", async () => {
  delete (globalThis as { fetch?: unknown }).fetch;
  const t = await loadTelemetry(ENDPOINT);
  assert.doesNotThrow(() => t.track("exam_started"));
  installFetch();
});

test("session_start fires once per session, not once per event", async () => {
  const t = await loadTelemetry(ENDPOINT);
  t.startSession();
  t.startSession();
  t.startSession();
  const starts = (sent as Record<string, unknown>[]).filter(
    (b) => b.event === "session_start",
  );
  assert.equal(starts.length, 1);
});

test("the visitor id is stable within its window and is not the session id", async () => {
  const t = await loadTelemetry(ENDPOINT);
  const v1 = t.visitorId();
  const v2 = t.visitorId();
  assert.equal(v1, v2, "visitor id rotated mid-window");
  assert.notEqual(v1, t.sessionId().id, "visitor id and session id are the same value");
  assert.match(v1, /^[0-9a-f-]{36}$/i);
});

test("a stale visitor id rotates rather than persisting forever", async () => {
  const t = await loadTelemetry(ENDPOINT);
  const first = t.visitorId();
  // Age it past the window. This is what stops the id becoming a durable
  // handle on a person.
  localStorage.setItem(
    t.VISITOR_KEY,
    JSON.stringify({ id: first, at: Date.now() - t.VISITOR_TTL_MS - 1 }),
  );
  assert.notEqual(t.visitorId(), first);
});

test("corrupt stored state is replaced rather than crashing", async () => {
  const t = await loadTelemetry(ENDPOINT);
  localStorage.setItem(t.VISITOR_KEY, "{not json");
  localStorage.setItem(t.SESSION_KEY, "null");
  assert.doesNotThrow(() => t.track("page_view"));
  assert.match(t.visitorId(), /^[0-9a-f-]{36}$/i);
});
