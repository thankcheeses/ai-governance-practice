# Usage telemetry

Answers one question the project could not answer at all: **is anyone using
this?**

It is off until deployed, and it is designed so that it can never become the
reason someone's study session broke.

---

## What is collected

Per event: a rotating visitor id, a session id, the event name, and — for a
question — the Body of Knowledge domain, the sub-domain, and whether the answer
was right. Derived at the edge from request metadata: country, US state,
device class, browser family, OS family, referrer category.

## What is not

| Never collected | Why it cannot happen |
| --- | --- |
| user id / email | no such column, and no foreign key to `auth.users` |
| which question, which option | not in the payload; asserted by an exact allowlist test |
| score, streak, answers | never sent |
| IP address | resolved to a country inside the function and discarded; **no column exists** |
| precise location | only country, and US state |
| browser/OS version | family only — a version string is a fingerprinting bit |
| referring URL | reduced to one of six categories at the edge; the URL is discarded |

A signed-in learner and a signed-out one produce **identical** rows.

## Three separations, all structural

1. **Telemetry cannot be joined to learning data.** It lives in its own
   `telemetry` schema with no `user_id` column and no foreign key to
   `auth.users`. Not a policy — there is nothing to join on.
2. **Nobody reads raw events.** `telemetry.events` has RLS enabled and *no
   policy at all*, so every browser role is denied, admins included. The
   dashboard reads `telemetry.daily`. An inspectable per-event log is what
   turns usage measurement into surveillance.
3. **The IP never lands.** It is read from request headers, mapped to a
   country, and dropped in the same invocation.

## Failure is always silent

Studying works identically whether telemetry succeeds, fails, is blocked, or
was never deployed:

- unconfigured endpoint → `track()` returns before building a request;
- storage throws (private mode, blocked site data) → treated as no telemetry;
- network rejects → caught and dropped;
- `fetch` missing → returns;
- opted out → the request is never made, not made and discarded.

Each of those is a test in `src/lib/telemetry/telemetry.test.ts`, and the
guarantees are mutation-tested: removing the opt-out check, adding a `userId`
to the payload, deleting the `.catch`, or freezing the visitor id all fail the
suite.

## The disclosure is enforced, not remembered

Before this existed the privacy policy said *"No analytics or telemetry SDK is
present in the app"* and *"signed out, the app collects no personal data at
all"*. Both became false the moment an event was sent.

`src/content/disclosure.test.ts` fails if the disclosure is removed while
telemetry is wired, or if either retired claim is reinstated. On a product
about AI governance, shipping collection its own policy does not describe would
falsify the thing the product is for — so it is asserted in CI rather than left
to memory.

## Deploying

```sh
# 1. schema
psql "$DATABASE_URL" -f supabase/migrations/0007_telemetry.sql

# 2. ingest function — --no-verify-jwt is required: signed-out visitors are
#    the point, so there is no JWT to verify.
supabase functions deploy collect --no-verify-jwt
supabase secrets set ALLOWED_ORIGINS="https://<user>.github.io"

# 3. point the app at it, then redeploy (NEXT_PUBLIC_* is inlined at build)
#    NEXT_PUBLIC_TELEMETRY_URL=https://<ref>.supabase.co/functions/v1/collect

# 4. grant yourself the dashboard
insert into telemetry.admins (user_id) values ('<your-auth-uid>');

# 5. nightly rollup + 90-day retention
select cron.schedule('telemetry-rollup', '20 3 * * *', $$select telemetry.roll_up()$$);
```

Until step 3, the app sends nothing.

## Reading the numbers honestly

"Visitors" counts a rotating identifier that resets every **90 days**, so a
learner returning after that is counted again. The dashboard says so on the
page. The trade is deliberate: a durable identifier would be more accurate and
would be a durable handle on a person.

Because the site is a static export there is no server-side sessionisation
either — sessions are client-timed with a 30-minute idle window. Treat all of
it as approximate.
