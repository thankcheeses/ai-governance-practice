# AI Governance Practice

**AI Governance Practice for Practitioners**

AI governance scenario training built for practitioners. AI Governance Practice helps
professionals build practical AI governance judgment through original
scenario-based learning.

The category is scenario training — practitioner judgment, mental models, and
applied decision-making. AIGP Preparation is the current track and the
acquisition wedge, not the product definition.

> **Independent Educational Product.** AI Governance Practice provides original
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
npm run build         # server build (Vercel)
npm run start         # serve the production build
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run seed          # sync the question bank into Supabase (optional)

npm run build:mobile  # static export into ./out for Capacitor
npm run mobile:sync   # build:mobile + npx cap sync
```

- **[docs/launch-readiness.md](docs/launch-readiness.md)** — readiness score,
  blockers, device test steps, launch order of operations
- **[docs/mobile-release.md](docs/mobile-release.md)** — packaging detail and
  store submission checklist

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
| Review | `/review` | Prioritised SM-2 queue |
| Progress | `/dashboard` | Accuracy, domain performance, mastery, review forecast |
| Settings | `/settings` | Theme, daily goal, account, disclaimer, legal, reset |

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

### 7. No plans, no gating

Everything is free. There is no paid tier, no checkout, no `/upgrade` route, and
no entitlement module — every scenario, the review queue, spaced repetition,
domain filtering, and the full analytics are available to everyone, signed in or
not.

This is a deliberate removal rather than an unbuilt feature. A gate with no
purchase path behind it cannot be opened by paying; it can only lock people out
of a product they have no way to buy. The plumbing that carried it — the `Tier`
union, `profiles.tier`, `entitlementsFor()`, the plan cards — is gone rather
than dormant, so no reader has to work out whether gating is live. Migration
`0004_drop_tier.sql` removes the column.

Lab definitions still live in `src/content/labs.ts` as **data only**: planned
labs mapped to future `TrackId`s, so lab content reuses the existing track
machinery rather than needing a parallel system. There are no lab routes, pages,
or components, and nothing in the UI mentions them.

### 8. Two build targets

`next.config.ts` branches on `MOBILE_BUILD`. The default is the unchanged
server build for Vercel; `MOBILE_BUILD=1` produces a static export into `./out`
for Capacitor, which disables middleware and the image optimizer. Neither
matters on device — middleware only refreshes an auth cookie for server
rendering, and bundled images need no optimizer. Keeping it behind a flag means
neither target can silently regress the other.

### 9. Theming and the Utilitarian palette

Semantic tokens are defined once per theme in `globals.css` and consumed through
Tailwind v4's `@theme`. No component branches on theme. An inline script in the
root layout sets `data-theme` on `<html>` before first paint, so there is no
flash. **Light is the default**; Dark and System are available in Settings.

The system is Utilitarian: industrial signage rather than product marketing.
Colour is a signal, never an accent.

| Role | Light | Dark |
| --- | --- | --- |
| Background | `#FFFFFF` | `#0A0A0A` off-black |
| Surface | `#FFFFFF` | `#141414` |
| Primary text | `#0A0A0A` | `#FFFFFF` |
| Primary fill | `#0A0A0A` on white | `#FFFFFF` on black |
| Alert | `#CC0000` signal red | `#FF5C5C` |
| Warning | `#8A6D00` | `#FFD700` safety yellow |
| Info / affirmative | `#003366` industrial blue | `#6FA8DC` |
| Rules | `#CCCCCC` / `#666666` | `#333333` / `#666666` |

Three notes on where the implementation reads the spec rather than transcribing
it:

- **No pure black.** The spec lists `#000000` as the dark background and then
  forbids it outright in its Don'ts. Charcoal `#0A0A0A` satisfies both.
- **No green.** The palette has none, and functional coding assigns blue to
  information. Industrial blue therefore carries the affirmative role — a
  correct answer, a met goal — where a conventional system would use green.
- **Signal colours are lifted in dark mode.** `#CC0000` on charcoal is 2.6:1 and
  `#FFD700` on white is 1.6:1; neither can carry text. Both themes use adjusted
  values behind text and reserve the pure signal hues for fills and rules. Every
  text pair in both themes clears WCAG AA at 4.5:1, verified against the
  computed tokens.

Radius is `0` at every step, shadows are capped at `0 2px 8px rgb(0 0 0 / 0.08)`,
and there are no gradients anywhere.

### 10. Typography and motion

**IBM Plex Mono only** — display, body, UI labels and technical values all sit on
one face, so columns scan vertically and nothing reads as a different kind of
text. Hero `clamp(2.5rem, 5vw, 4rem)`, H1 `2.25rem`, H2 `1.5rem`, body `1rem/1.6`
capped at **72 characters** via the `.measure` utility, small `0.875rem`.

**No animation except functional state changes.** There is no entry animation, no
hover scaling, no page transition, and no animation library in the bundle —
removing `framer-motion` took roughly 40 kB off every route. What remains is
colour transitions on hover, a 1px translate on press, and a shimmer skeleton
for loading; the spec rules out circular spinners.

### 11. Visual language

Two languages, no others:

1. **The mark** — a shield with a verification check, in one geometry at two
   sizes. `flat` for chrome, `glass` (a legacy prop name; the treatment is flat)
   for splash and empty states.
2. **Educational sketch** — for responsibility maps, timelines, and workflows,
   when supplied.

The app ships **no invented illustrations**. Empty states use the mark, not
decorative art.

Target ratio is roughly 80% clean text-based learning to 20% high-value visuals
that reduce cognitive load. Visuals explain sequence, responsibility,
architecture, decision flow, or failure points — never decoration.

---

## Database

Schema: `supabase/migrations/` (run `supabase/apply-all.sql` once)

| Table | Purpose |
| --- | --- |
| `tracks` | Learning tracks; only `active` ones surface in the app |
| `questions` | Reference content, track-scoped, with `position` for ordering |
| `profiles` | Per-user settings: daily goal, streak, theme, onboarding |
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

## Visual aids

Questions may carry an optional diagram:

```ts
visualAid?: {
  type: "workflow" | "decision-tree" | "responsibility-map"
      | "architecture" | "timeline";
  src: string;
  alt: string;
  caption?: string;
}
```

Attach one by adding the field to a question's entry in `enrichment.ts` and
dropping the asset under `/public`. The source `questions.json` is never touched.

`VisualAid` (`src/components/study/visual-aid.tsx`) renders between the question
stem and the answer choices, so the diagram reads as context for the question
rather than commentary on an answer. It is capped at 180px on mobile and 240px
above `sm`, keeping the options reachable without hunting.

Two rules are enforced in the component:

- It renders **only** when `visualAid` exists. There are no placeholders.
- If the asset is missing or fails to load, it renders **nothing** — the question
  degrades silently to text rather than showing a broken frame.

No diagrams ship in this repository. Assets are supplied separately; v1 targets
8–12 questions, not all of them.

---

## Project structure

```
src/
├── app/                     # routes (App Router)
│   ├── layout.tsx           # fonts, theme init script, providers
│   ├── page.tsx             # entry — routes to onboarding or home
│   ├── onboarding/  home/  study/  review/  dashboard/  settings/
│   ├── login/  privacy/  terms/
│   └── globals.css          # design tokens for both themes
├── components/
│   ├── ui/                  # shadcn-style primitives
│   ├── app/                 # shell, gate, disclaimer, charts
│   └── study/               # question view, feedback panel, session runner
├── content/                 # track-based content model
├── lib/
│   ├── adaptive.ts          # difficulty targeting, domain stats, selection
│   ├── spaced-repetition.ts # SM-2 + review queue
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
and a maskable icon carrying the brand mark. Adding a service worker for offline study is the natural next
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

## Positioning copy

Brand copy lives in `src/lib/brand.ts` as the single source.

Approved lines:

- "AI governance scenario training built for practitioners."
- "Build judgment through realistic governance scenarios."
- "Practice applying AI governance frameworks to real-world decisions."

Never used, anywhere in the product:

- "Pass your AIGP exam"
- "Official AIGP preparation"
- "IAPP approved"
- anything positioning the product as a certification replacement

---

## Content policy

All questions, scenarios, rationales, and key takeaways are original educational
material. This product does not contain, reproduce, paraphrase, or reference
actual certification exam content from any certification body.

Framework and standard names (NIST AI RMF, EU AI Act, ISO 42001) are the property
of their respective owners and appear only to describe the subject matter
studied. Content is provided for educational purposes and does not constitute
legal, compliance, or professional advice.
