# Judgment Labs

**AI Governance Practice for Practitioners**

Judgment Labs helps professionals build practical AI governance judgment through
original scenario-based learning.

> **Independent Educational Product.** Judgment Labs provides original
> educational content for professional development in AI governance. This
> product is not affiliated with, endorsed by, sponsored by, or connected to the
> International Association of Privacy Professionals (IAPP), CompTIA, Cloud
> Security Alliance, or any certification body. This product does not contain
> actual certification exam questions and does not guarantee exam success. All
> questions and scenarios are original educational material.

---

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. **No environment variables are required** — the
app runs fully with progress stored in the browser. Supabase is optional and
adds accounts plus cross-device sync.

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run seed       # sync the question bank into Supabase (optional)
```

---

## What ships in this MVP

**Active track: AIGP Preparation** — 50 original questions across four domains
derived from the content itself:

| Domain | Questions |
| --- | --- |
| Foundations of AI Governance | 7 |
| Laws, Standards, and Frameworks | 7 |
| Governing AI Development | 11 |
| Governing AI Deployment and Use | 25 |

The complete learning loop is implemented:

```
Home → Select study → Question → Answer → Feedback → Rationale
     → Key takeaway → Next question → Progress update
```

| Screen | Route | What it does |
| --- | --- | --- |
| Onboarding | `/onboarding` | Three-step first launch, ending in the disclaimer |
| Home | `/home` | Daily goal, streak, answered today, total completed, accuracy |
| Study | `/study` | Mixed adaptive sessions and per-domain practice |
| Session | `/study/session` | One question per screen with full feedback |
| Review | `/review` | Prioritised SM-2 queue (Pro) |
| Progress | `/dashboard` | Accuracy, domain performance, mastery, review forecast |
| Settings | `/settings` | Theme, daily goal, account, disclaimer, legal, reset |
| Upgrade | `/upgrade` | Feature gating placeholder — no checkout |

---

## Architecture decisions

### 1. Track-based content model

The central architectural requirement: **new learning tracks must not require
restructuring**. A track is a folder under `src/content/tracks/` plus one entry
in the registry.

```
src/content/
├── types.ts                       # Question, Track, Difficulty, FrameworkTag
├── registry.ts                    # the only file a new track touches
└── tracks/
    └── aigp-preparation/
        ├── questions.json         # source content, checked in UNMODIFIED
        ├── enrichment.ts          # difficulty / key takeaway / framework tags
        └── index.ts               # normalizes raw JSON → Question
```

Adding a track is three steps: create the folder, export a `Question[]`, add it
to `TRACKS` and `QUESTIONS_BY_TRACK` in `registry.ts`. No schema change — the
database is already track-scoped — and no new routes.

`TrackId` declares the planned tracks (Healthcare AI Governance, Voice AI
Governance, Agentic AI Governance, EU AI Act Operations, AI Security Governance,
Responsible AI Implementation) so routing, progress scoping, and analytics
already understand them. **Only `status: "active"` tracks render anywhere.**
There are no placeholder pages or empty modules for tracks without content.

### 2. Source content is never modified

`questions.json` is the supplied file, byte for byte. Question meaning is never
altered.

The data model additionally requires `difficulty`, `key_takeaway`, and
`framework_tags`, which the source does not carry. Those live in a separate
`enrichment.ts` layer keyed by source question id:

- **difficulty** — a classification of each existing item (`foundational` /
  `applied` / `advanced`), based on whether it tests a definition, a situated
  judgement, or a multi-control design decision.
- **keyTakeaway** — the item's *own rationale* restated as a portable rule. It
  introduces no claim the rationale does not already make.
- **frameworkTags** — mapping onto the controlled vocabulary in
  `content/types.ts`.

Keeping this separate means the source file can be replaced or extended without
touching editorial metadata, and it is always obvious which fields are derived.

Options in the source are prefixed (`"A. Some text"`); `index.ts` strips the
prefix so the UI owns presentation and scoring keys by position rather than by a
label that must survive rendering.

### 3. Domains are derived, never hardcoded

`aigpDomains` is computed from the content. The study picker, dashboard, and
filters all read from it, so a domain cannot appear in the UI unless questions
exist for it.

### 4. Local-first progress, optional Supabase

`ProgressProvider` (`src/lib/store/progress-provider.tsx`) is the single source
of truth. It writes to `localStorage` on every change and, when a user is signed
in, mirrors to Supabase in fire-and-forget writes. Local state stays
authoritative so a network failure never blocks or loses an answer.

Signing in on a device with existing local progress **adopts** that progress into
the new account rather than discarding it.

Consequence: the app is fully functional with zero configuration, and Supabase is
a genuine enhancement rather than a hard dependency.

### 5. Adaptive learning is transparent, not a model

`src/lib/adaptive.ts` scores each candidate question on three readable signals:
unseen-first, weak-domain boost, and difficulty proximity to a target derived
from recent accuracy. A practitioner could read the function and predict its
output. The seams are in place for more sophistication later; the MVP does not
pretend to more than it does.

### 6. Gamification is deliberately minimal

There are no points, levels, or badges. The motivational surface is a daily goal
and a streak — what a working professional actually uses to hold a habit. This
was a product constraint, and it is enforced by the absence of the concepts from
`lib/types.ts` rather than by convention.

### 7. Feature gating in one place

`src/lib/entitlements.ts` is the only module that branches on tier. Free covers
the **first 20 questions in track order** (a coherent run, not a random sample)
with mixed practice. Pro unlocks the full library, domain filtering, the review
queue, and advanced analytics. There is no payment integration; `/upgrade`
explains the tiers and lets you toggle the Pro preview to exercise the gated
paths.

### 8. Theming without a flash

Semantic tokens (`--background`, `--card`, `--muted-foreground`, …) are defined
once per theme in `globals.css` and consumed through Tailwind v4's `@theme`. No
component branches on theme. An inline script in the root layout sets
`data-theme` on `<html>` before first paint, so there is no flash of the wrong
theme. Dark is the default; Light and System are available in Settings.

---

## Database

Schema: `supabase/migrations/0001_init.sql`

| Table | Purpose |
| --- | --- |
| `tracks` | Learning tracks; only `active` ones surface in the app |
| `questions` | Reference content, track-scoped, with `position` for ordering |
| `profiles` | Per-user settings: tier, daily goal, streak, theme, onboarding |
| `attempts` | One row per answered question, with confidence and mode |
| `review_cards` | SM-2 state: repetitions, ease factor, interval, next review |

Every per-user table enforces **row level security** — a user can only read or
write rows where `auth.uid() = user_id`. Content tables are public read-only;
the seed script writes with the service role key, which bypasses RLS.

A trigger on `auth.users` auto-provisions a `profiles` row at signup.

### Setting up Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the environment file and fill in the values from
   **Project Settings → API**:

   ```bash
   cp .env.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # seeding only
   ```

3. Run the migration — paste `supabase/migrations/0001_init.sql` into the SQL
   Editor, or use the CLI:

   ```bash
   supabase db push
   ```

4. Optionally mirror the question bank into the database:

   ```bash
   npm run seed
   ```

   Seeding is not required — the app reads content from the bundled modules.
   It exists so the database mirrors shipped content for analytics joins and
   future server-side features.

5. Restart the dev server. Sign-in appears in Settings.

**Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.** It is read only by
`scripts/seed.ts` and bypasses row level security.

---

## Spaced repetition

`src/lib/spaced-repetition.ts` implements SM-2 with three deliberate deviations:

- Four grades (Again / Hard / Good / Easy) instead of six.
- **Again** resets repetitions but only *reduces* the ease factor rather than
  restarting it, so one lapse does not erase an item's history.
- Early intervals are fixed, making the first few reviews predictable — which
  matters when someone is studying against a date.

The review queue prioritises in this order:

1. **Missed** — most recent attempt was incorrect
2. **Low confidence** — answered correctly but self-rated *guessed* or *unsure*
3. **Due** — scheduled review date has arrived

Confidence capture is optional and appears after an answer is selected. A missed
question enters the queue immediately, so it survives between sessions even if
the learner never opens `/review`.

---

## Project structure

```
src/
├── app/                     # routes (App Router)
│   ├── layout.tsx           # fonts, theme init script, providers
│   ├── page.tsx             # entry — routes to onboarding or home
│   ├── onboarding/  home/  study/  review/  dashboard/  settings/
│   ├── upgrade/  login/
│   └── globals.css          # design tokens for both themes
├── components/
│   ├── ui/                  # shadcn-style primitives
│   ├── app/                 # shell, gate, disclaimer, charts
│   └── study/               # question view, feedback panel, session runner
├── content/                 # track-based content model
├── lib/
│   ├── adaptive.ts          # difficulty targeting, domain stats, selection
│   ├── spaced-repetition.ts # SM-2 + review queue
│   ├── entitlements.ts      # feature gating
│   ├── brand.ts             # brand + disclaimer copy (single source)
│   ├── store/               # progress and theme providers
│   └── supabase/            # client, server, sync
├── middleware.ts            # Supabase session refresh (pass-through if unset)
supabase/migrations/         # database schema
scripts/seed.ts              # content → database
```

---

## Mobile and PWA

Mobile-first throughout: a bottom tab bar under `lg`, a sidebar above it, from a
single nav definition. iOS safe areas are handled via `env(safe-area-inset-*)`
utilities. Tap targets meet the 44px minimum, and `prefers-reduced-motion` is
respected globally.

PWA-ready: `public/manifest.webmanifest` with standalone display, theme colour,
and maskable icon. Adding a service worker for offline study is the natural next
step and needs no architectural change.

---

## Deploying to Vercel

1. Push to GitHub and import the repository at
   [vercel.com/new](https://vercel.com/new).
2. Framework preset is detected automatically. No build configuration needed.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under
   **Settings → Environment Variables** if you want accounts. Omit them and the
   deployment runs in local-progress mode.
4. Add `SUPABASE_SERVICE_ROLE_KEY` only if you intend to run the seed script
   from CI.
5. In Supabase, add your deployment URL to **Authentication → URL Configuration
   → Redirect URLs**.

---

## Content policy

All questions, scenarios, rationales, and key takeaways are original educational
material. This product does not contain, reproduce, paraphrase, or reference
actual certification exam content from any certification body.

Framework and standard names (NIST AI RMF, EU AI Act, ISO 42001) are the property
of their respective owners and appear only to describe the subject matter
studied. Content is provided for educational purposes and does not constitute
legal, compliance, or professional advice.
