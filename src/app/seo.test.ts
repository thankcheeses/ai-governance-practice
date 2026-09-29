import assert from "node:assert/strict";
import { test } from "node:test";
import robots, { DISALLOWED_PATHS, rulesFor } from "./robots";
import sitemap from "./sitemap";
import { BASE_PATH, SITE_URL } from "@/lib/base-path";

/**
 * These two files are the easiest thing in the app to get silently wrong.
 *
 * Both are served from the *origin root* while the app itself lives under
 * `/<repo>/` on a project site. A rule or a URL written without the base path
 * still produces a valid-looking robots.txt and a valid-looking sitemap — they
 * just describe paths that do not exist, so the app routes stay crawlable and
 * the listed pages 404. Nothing fails; the file is simply wrong.
 */

test("every crawl rule carries the base path", () => {
  // Checked against a non-empty prefix on purpose. BASE_PATH is "" in every
  // environment except a Pages build, so asserting against the live value
  // would pass whether or not the prefixing happens — and the project site is
  // the only place it matters.
  const PREFIX = "/ai-governance-practice";
  const [rule] = rulesFor(PREFIX) as { allow: string; disallow: string[] }[];
  assert.equal(rule.allow, `${PREFIX}/`);
  for (const path of rule.disallow) {
    assert.ok(
      path.startsWith(`${PREFIX}/`),
      `"${path}" does not carry the base path`,
    );
  }
  assert.equal(rule.disallow.length, DISALLOWED_PATHS.length);
});

test("the app shell is kept out of the index", () => {
  // Not an SEO preference. These routes render an empty shell to anyone
  // without local progress — a crawler has no localStorage — so indexing them
  // would put pages that say nothing in front of the four that do.
  const [rule] = robots().rules as { disallow: string[] }[];
  for (const route of [
    "/study",
    "/exam",
    "/review",
    "/dashboard",
    "/settings",
    "/onboarding",
    "/home",
  ]) {
    assert.ok(
      rule.disallow.includes(`${BASE_PATH}${route}`),
      `${route} is crawlable`,
    );
  }
});

test("auth routes are never indexed", () => {
  // An indexed sign-in page has no search value and is a standing
  // phishing-lookalike risk.
  const [rule] = robots().rules as { disallow: string[] }[];
  for (const route of ["/login", "/reset"]) {
    assert.ok(rule.disallow.includes(`${BASE_PATH}${route}`), `${route} is crawlable`);
  }
});

test("the sitemap lists only absolute URLs on the real origin", () => {
  for (const entry of sitemap()) {
    assert.match(entry.url, /^https:\/\//, `relative sitemap URL: ${entry.url}`);
    assert.ok(
      entry.url.startsWith(SITE_URL),
      `${entry.url} is not under ${SITE_URL}`,
    );
  }
});

test("the sitemap and the crawl rules do not contradict each other", () => {
  // Listing a page in the sitemap while disallowing it is the classic
  // self-cancelling SEO bug: it asks a crawler to fetch what it just forbade.
  const [rule] = robots().rules as { disallow: string[] }[];
  for (const entry of sitemap()) {
    const path = entry.url.slice(SITE_URL.length) || "/";
    const full = `${BASE_PATH}${path}`;
    assert.ok(
      !rule.disallow.some((d) => full === d || full.startsWith(`${d}/`)),
      `${entry.url} is in the sitemap but disallowed in robots.txt`,
    );
  }
});

test("the sitemap points at the pages that actually say something", () => {
  const paths = sitemap().map((e) => e.url.slice(SITE_URL.length) || "/");
  assert.deepEqual(paths.sort(), ["/", "/help", "/privacy", "/terms"]);
});

test("robots.txt advertises the sitemap at an absolute URL", () => {
  assert.equal(robots().sitemap, `${SITE_URL}/sitemap.xml`);
});

test("the operator dashboard is never indexed", () => {
  // Its own test rather than a line in the signed-in group, because the reason
  // differs. Those routes are excluded for being empty to a crawler; /admin is
  // excluded because it exists for one person. What actually keeps it private
  // is RLS — a non-member of `telemetry.admins` reads an empty set from
  // `telemetry.daily` — so this assertion guards discoverability, not access,
  // and passing it is not evidence that the dashboard is protected.
  const [rule] = robots().rules as { disallow: string[] }[];
  assert.ok(rule.disallow.includes(`${BASE_PATH}/admin`), "/admin is crawlable");
});
