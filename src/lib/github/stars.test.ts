import assert from "node:assert/strict";
import { test } from "node:test";
import { checkStarred, exchangeCode, setStarred, STAR_REPO } from "./stars";

/*
  What is covered here, and what is not.

  The token store and the authorize/state helpers touch `sessionStorage`, which
  does not exist in this runner — there is no DOM. They are exercised in the
  browser instead. What is testable without one is the part most likely to be
  got wrong silently: how GitHub's status codes are read.

  That mapping is genuinely counter-intuitive. `GET /user/starred/...` answers
  **404 when the repository is simply not starred**, which is a normal answer
  rather than a failure, and treating it as an error would leave a signed-in
  user staring at a broken control for the ordinary case.
*/

const res = (status: number) => new Response(null, { status });
const fetchWith = (status: number) =>
  (async () => res(status)) as unknown as typeof fetch;

test("204 means the repository is starred", async () => {
  assert.equal(await checkStarred("t", { fetch: fetchWith(204) }), "starred");
});

test("404 means not starred, not an error", async () => {
  // The case that matters: GitHub uses 404 for "no star record exists".
  assert.equal(await checkStarred("t", { fetch: fetchWith(404) }), "unstarred");
});

test("401 is reported as unauthenticated so the UI can re-offer sign-in", async () => {
  assert.equal(
    await checkStarred("t", { fetch: fetchWith(401) }),
    "unauthenticated",
  );
});

test("a network failure is an error rather than a thrown exception", async () => {
  const boom = (async () => {
    throw new Error("offline");
  }) as unknown as typeof fetch;
  assert.equal(await checkStarred("t", { fetch: boom }), "error");
});

test("starring and unstarring use PUT and DELETE on the right repository", async () => {
  const calls: { url: string; method?: string }[] = [];
  const spy = (async (url: string, init: RequestInit) => {
    calls.push({ url, method: init.method });
    return res(204);
  }) as unknown as typeof fetch;

  assert.equal(await setStarred("t", true, { fetch: spy }), "starred");
  assert.equal(await setStarred("t", false, { fetch: spy }), "unstarred");

  assert.equal(calls.length, 2);
  assert.equal(calls[0].method, "PUT");
  assert.equal(calls[1].method, "DELETE");
  for (const c of calls) {
    assert.ok(
      c.url.endsWith(`/user/starred/${STAR_REPO.owner}/${STAR_REPO.repo}`),
      `unexpected endpoint: ${c.url}`,
    );
  }
});

test("a declined or insufficient scope surfaces as an error, not a false success", async () => {
  // 403 is what GitHub returns when `public_repo` was not granted. Reporting
  // success here would show "Starred" for a star that does not exist.
  assert.equal(await setStarred("t", true, { fetch: fetchWith(403) }), "error");
});

test("the token never travels anywhere except api.github.com", async () => {
  const seen: string[] = [];
  const spy = (async (url: string) => {
    seen.push(url);
    return res(204);
  }) as unknown as typeof fetch;
  await checkStarred("secret-token", { fetch: spy });
  await setStarred("secret-token", true, { fetch: spy });
  for (const url of seen) {
    assert.ok(
      url.startsWith("https://api.github.com/"),
      `token was sent to a non-GitHub host: ${url}`,
    );
  }
});

test("the code exchange reports failure instead of returning a bogus token", async () => {
  const noToken = (async () =>
    new Response(JSON.stringify({ error: "bad_verification_code" }), {
      status: 200,
    })) as unknown as typeof fetch;

  const outcome = await exchangeCode("c", "https://app/cb", {
    endpoint: "https://example.invalid/github-oauth",
    fetch: noToken,
  });
  assert.equal(outcome.ok, false);
});

test("no exchange is attempted when the endpoint is not configured", async () => {
  let called = false;
  const spy = (async () => {
    called = true;
    return res(200);
  }) as unknown as typeof fetch;

  const outcome = await exchangeCode("c", "https://app/cb", {
    endpoint: null,
    fetch: spy,
  });
  assert.equal(outcome.ok, false);
  assert.equal(called, false, "an unconfigured build must not make a request");
});
