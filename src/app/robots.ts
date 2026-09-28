import type { MetadataRoute } from "next";
import { BASE_PATH, SITE_URL } from "@/lib/base-path";

/**
 * Crawl rules. Emitted as a static `robots.txt` by both export targets.
 *
 * Most of this app is deliberately *not* worth indexing, which is the opposite
 * of the usual instinct and is the point of the file.
 *
 * Everything under the app shell — study, exam, review, dashboard, settings,
 * onboarding — is client-rendered behind a gate that redirects anyone without
 * local progress to `/onboarding`. A crawler has no localStorage, so what it
 * would index is an empty shell: no questions, no analytics, no content. Those
 * pages would compete in the index with the four that actually say something,
 * and they would say nothing.
 *
 * `/login` and `/reset` are excluded for the same reason plus a second one:
 * indexed auth pages are a standing phishing-lookalike risk and they have no
 * search value whatever.
 *
 * Paths carry the base path by hand. robots.txt is served from the origin root
 * but the app lives under `/<repo>/` on a project site, so a bare `/study`
 * rule would describe a path that does not exist and leave the real one
 * crawlable.
 */
/*
  Required under `output: "export"`. These routes read NEXT_PUBLIC_SITE_URL,
  which Next treats as a dynamic input, so without this it refuses to
  pre-render them and the whole static build fails. The value is inlined at
  build time, so "force-static" is accurate rather than a workaround.
*/
export const dynamic = "force-static";

/**
 * Routes kept out of the index, as app-relative paths.
 *
 * Exported without the base path applied so the prefixing can be tested
 * against a non-empty one. `BASE_PATH` is empty in every environment except a
 * Pages build, so a test that read it directly would assert nothing — it is
 * exactly the project-site case that breaks, and exactly the one a bare
 * constant cannot reach.
 */
export const DISALLOWED_PATHS = [
  "/study",
  "/exam",
  "/review",
  "/dashboard",
  "/settings",
  "/onboarding",
  "/home",
  "/login",
  "/reset",
  "/github",
] as const;

/** The rules for a given base path. Pure, so it can be checked at any prefix. */
export function rulesFor(basePath: string): MetadataRoute.Robots["rules"] {
  return [
    {
      userAgent: "*",
      allow: `${basePath}/`,
      disallow: DISALLOWED_PATHS.map((path) => `${basePath}${path}`),
    },
  ];
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: rulesFor(BASE_PATH),
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
