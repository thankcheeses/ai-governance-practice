# Note: Prisma is not used here (decided, not deferred)

Supabase's own quickstart panels offer Prisma as one way to reach the database.
It was considered on 28 September 2026 and declined by the project owner. This
note records the reasoning so the question does not get re-opened by whoever
next reads a Supabase getting-started page, including a future agent.

The decision is about architecture, not about Prisma's quality.

## There is nowhere for Prisma Client to run

Both build targets set `output: "export"` (`next.config.ts`), and the app has no
API routes at all — `find src/app -name "route.ts"` returns nothing. There is no
middleware and no server process. The Pages deploy and the Capacitor mobile
build both ship a directory of static files.

Prisma Client needs a Node runtime holding a direct TCP connection to Postgres.
A static export has no such runtime, so a `DATABASE_URL` would have no consumer.
Putting one in the repo would add a credential to guard in exchange for nothing.

What the app actually does instead: `@supabase/supabase-js` over HTTPS from the
browser (`src/lib/supabase/client.ts`, `sync.ts`), with **RLS as the real access
control**. That is the right pattern for a static site, because the security
boundary is in the database rather than in a server the deploy does not have.

## It would create a second source of schema truth

The schema lives in hand-written SQL under `supabase/migrations/`. What those
migrations depend on is the part Prisma Migrate models least well:

- row-level security policies, including the deliberate deny-all-by-having-no-
  policy pattern on `telemetry.events`;
- explicit grants and revokes (`revoke all on telemetry.events from anon,
  authenticated`);
- a schema other than `public`;
- SQL functions (`roll_up(date)`).

`0007_telemetry.sql` is very nearly nothing but those four things. Introducing
`schema.prisma` alongside it would mean two files claiming to describe one
database, and the one Prisma could not fully express is the one carrying the
privacy guarantees. Two sources of truth about access control is worse than a
less fashionable single one.

## What would have to change first

Adopting Prisma Client is not an addition to this architecture; it replaces the
data layer and requires a server, which ends the GitHub Pages deploy. That is a
separate project with its own justification, not a dependency install. If it is
ever wanted, it should be scoped as such rather than arrived at by following a
quickstart.

## What was adopted instead

The Supabase **MCP server** and the two upstream **agent skills**, checked in at
project scope so the tooling is shared and reviewable. Those help author and
audit the SQL that already exists; they do not change how the app reaches the
database. See `.mcp.json` and `.claude/skills/`.
