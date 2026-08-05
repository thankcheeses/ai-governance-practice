# Mobile release

Assessment and checklist for shipping NHID-Clinical to the App Store and Play
Store. Written against the state of the repo at the time of the mobile pass.

---

## 1. Readiness assessment

### Current stack

Next.js 15.5 App Router, React 19, TypeScript, Tailwind v4. **Every page is a
client component.** There are no route handlers, no server components, and no
server-side data fetching. Supabase is optional and, when configured, is reached
from the browser client.

That architecture is what makes this straightforward: the app is already a
single-page client app that happens to be built by Next.

### Verdict: Capacitor, no migration required

A static export was run and **succeeds** — 15 HTML routes plus assets, produced
into `./out`. The exported bundle was then served as flat files with no server
and the complete learning loop was exercised in a mobile-sized WebView:
onboarding → study → answer → feedback → continue → dashboard, with progress
surviving a reload. No failed requests, no runtime errors.

A native wrapper (React Native / Expo) is **not** required and would mean
rewriting the entire UI layer for no functional gain.

### What the static target gives up

| Feature | Impact on mobile | Verdict |
| --- | --- | --- |
| `middleware.ts` (Supabase cookie refresh) | Disabled by `output: export` | **Not a blocker.** Middleware exists to refresh the auth cookie for server rendering. In a WebView every page is client-rendered and `supabase-js` refreshes its own tokens. Nothing to do. |
| `next/image` optimizer | Disabled; images served as-is | **Not a blocker.** Images ship inside the app bundle, so on-demand optimization has no value. Set `unoptimized`. |
| Server components / route handlers | Would break | **None exist.** Nothing to migrate. |

Both losses are confined to the mobile target. The web build is untouched.

### How the two targets coexist

`next.config.ts` reads `MOBILE_BUILD`:

```bash
npm run build          # server build for Vercel — middleware + optimizer intact
npm run build:mobile   # static export into ./out for Capacitor
npm run mobile:sync    # build:mobile + npx cap sync
```

Neither target can silently regress the other, and Vercel deployment is
unchanged.

### Files affected by this pass

| File | Change |
| --- | --- |
| `next.config.ts` | Conditional `output: "export"` behind `MOBILE_BUILD` |
| `capacitor.config.ts` | New — app id, name, `webDir: "out"`, platform options |
| `package.json` | `build:mobile`, `mobile:sync`, `mobile:android`, `mobile:ios` |
| `.gitignore` | Ignore generated `/android` and `/ios` |

Native platform folders are **not committed**. They are generated output
requiring Android Studio / Xcode:

```bash
npm run build:mobile
npx cap add android
npx cap add ios
npx cap sync
```

### Risks

1. **Client-side routing on `file://`.** Capacitor serves over an app scheme
   rather than `file://`, and `trailingSlash: true` emits a real `index.html`
   per route, so deep links resolve. Verified against flat-file serving.
2. **Supabase auth redirects.** Resolved in code — `signUp` now sets
   `emailRedirectTo`. The URL still has to be registered in the Supabase
   dashboard. See section 3.2.
3. **Apple guideline 4.2 (minimum functionality).** A web view wrapping a
   remote URL gets rejected. Bundling the assets, as configured, means the app
   is functional offline and is not a thin wrapper.
4. **Safe areas.** Already handled via `env(safe-area-inset-*)` utilities and
   verified at mobile viewport, but needs a re-check on a device with a notch.
5. **Text scaling.** Large OS font sizes can overflow the fixed question layout.
   Untested on device.

---

## 2. Store submission checklist

| Item | Status | Notes |
| --- | --- | --- |
| App name | ✅ | NHID-Clinical |
| Bundle / application ID | ✅ | `org.nhidclinical.app` (set in `capacitor.config.ts`) |
| App icon | ⚠️ Partial | `public/icon.svg` exists. Stores need **raster PNG** at many sizes — 1024×1024 for App Store, adaptive icon for Play. Generate with `@capacitor/assets`. |
| Splash screen | ⚠️ Partial | Brand mark renders in-app at `/`. A **native** splash asset is still needed. |
| Privacy policy URL | ✅ In-app | `/settings/privacy` carries a full policy naming NHID-Clinical as controller, with an effective date. Still needs to be reachable at a **public URL** for the store listing, and reviewed by counsel. |
| Terms URL | ✅ In-app | `/settings/terms` carries full Terms of Service. Same two caveats: public URL for the listing, and counsel review. |
| Support contact | ✅ | `contact@nhid-clinical.org`, from `COMPANY` in `src/lib/brand.ts`. |
| Store description | ⚠️ Draft below | Not yet finalised. |
| Screenshots | ❌ | Required per device class: 6.7" and 5.5" iPhone, 12.9" iPad if iPad is supported; phone and tablet for Play. |
| Data safety / privacy nutrition labels | ⚠️ | Answers drafted below; must match actual behaviour. |
| Account deletion | ✅ Implemented | Settings → Account → Delete account, shown only when signed in. Calls the `delete-account` edge function, which deletes the auth user with the service role; cascades clear progress. **Must be deployed** — see blockers. |
| Age rating | ⚠️ | 4+ / Everyone. No objectionable content. |
| Export compliance | ⚠️ | Uses HTTPS only. Standard exemption applies; declare it. |

### Draft store description

> **NHID-Clinical — AI Governance Practice for Practitioners**
>
> AI governance scenario training built for practitioners. Work through
> realistic governance situations and build the judgment to reason through
> decisions you have not seen before.
>
> - Original scenario-based questions across AI governance domains
> - Full rationale and a key takeaway on every answer
> - Framework grounding: NIST AI RMF, EU AI Act, ISO 42001, responsible AI
> - Adaptive review with spaced repetition
> - Progress tracking and weak-domain analysis
>
> Independent educational product. Not affiliated with, endorsed by, sponsored
> by, or connected to the IAPP, CompTIA, Cloud Security Alliance, or any
> certification body. Contains no actual certification exam questions and does
> not guarantee exam success.

The disclaimer paragraph is **not optional** in store copy. Both stores police
implied certification affiliation, and the product's positioning depends on it.

### Data disclosure answers

Matches what the app actually does today:

| Question | Answer |
| --- | --- |
| Data collected | Email address, **only** if the user creates an account |
| Data linked to user | Study progress (answers, review schedule, streak) when signed in |
| Data used for tracking | **None** |
| Third-party analytics | **None** — no analytics SDK is present |
| Advertising identifiers | **None** |
| Payment data | **None** — no checkout exists |
| Data stored on device | All progress, via localStorage |
| Encryption in transit | Yes, HTTPS to Supabase |
| Account deletion offered | **Yes** — Settings → Account (requires the edge function to be deployed) |

---

## 3. Mobile auth requirements (verified)

Three findings from reading the auth path against a WebView deployment.

### 3.1 Session storage uses cookies — needs verification on device

`getBrowserSupabase()` uses `createBrowserClient` from `@supabase/ssr`, which
persists the session in **cookies**. That is correct for the web build, where
middleware reads the same cookie server-side.

In a Capacitor WebView the app is served from `capacitor://localhost` (iOS) or
`https://localhost` (Android). Cookies generally work there, but persistence
across cold starts is not guaranteed the way `localStorage` is, and iOS WebView
cookie policy has historically been the fragile part.

**Not changed in this pass** — swapping the client factory affects the web
build's middleware contract, which is architecture. The fix, if device testing
shows session loss, is to pass a `localStorage`-backed storage adapter to the
browser client for the mobile target only. **Must be tested on device before
submission.**

### 3.2 Email confirmation redirect — fixed

`signUp` now passes `emailRedirectTo`, derived from `NEXT_PUBLIC_SITE_URL` and
falling back to `window.location.origin`. Without it, confirmation links go to
the project's default Site URL, which is wrong inside a WebView.

Still required in the Supabase dashboard: add the value to **Authentication →
URL Configuration → Redirect URLs**. Code cannot do this.

### 3.3 Deep linking is not yet required

Because confirmation returns to an https origin rather than into the app, a
custom URL scheme is **not** needed for the current password flow. It becomes
necessary only if you switch to magic-link or OAuth sign-in, where the callback
must re-enter the app. Deferred deliberately rather than built speculatively.

---

## 4. Capacitor configuration (verified)

`capacitor.config.ts` was checked field-by-field against the Capacitor 8
`CapacitorConfig` type in `node_modules/@capacitor/cli/dist/declarations.d.ts`.
All keys are real:

| Field | Value | Why |
| --- | --- | --- |
| `appId` | `org.nhidclinical.app` | Valid reverse-DNS. Must match the Apple bundle ID and Play application ID exactly. |
| `appName` | `NHID-Clinical` | Store display name |
| `webDir` | `out` | Static export target |
| `server.androidScheme` | `https` | Avoids mixed-content and `file://` restrictions |
| `ios.contentInset` | `always` | Clears notch and home indicator |
| `ios.zoomEnabled` / `android.zoomEnabled` | `false` | Pinch-zoom breaks the fixed question layout |
| `ios.backgroundColor` / `android.backgroundColor` | `#FAFAF9` | Matches the light theme, so no white flash on launch |

Both build targets were re-run after these changes and both pass. The static
bundle was served as flat files and the full learning loop, Settings, legal
pages, and upgrade screen were exercised with no console errors.

---

## 4a. Store icons, splash, and screenshots (generated)

### Regenerating

Source assets live in `assets/` and are derived mechanically from the existing
brand mark in `public/icon.svg` — nothing is drawn by hand:

```bash
node scripts/build-store-assets.mjs   # icon.svg -> assets/*.png
npx capacitor-assets generate         # assets/*.png -> android/, ios/, PWA icons
```

`build-store-assets.mjs` emits five sources: a full-bleed `icon.png`, the
Android adaptive pair (`icon-background.png` plus `icon-foreground.png`, whose
mark is scaled to 62% to survive launcher masking), and light/dark
`splash*.png` matching the `--background` tokens.

That produces 136 Android assets, 13 iOS assets, and the PWA icon set. The
Android launcher icons are the NHID-Clinical shield, **not** the Capacitor
placeholder — verified against `mipmap-xxxhdpi/ic_launcher.png`.

### Two things `capacitor-assets` does that you must undo

It is destructive outside the platform folders. After every run, check:

1. **It deletes `public/icon.svg` and `public/icon-maskable.svg`.** Restore them
   (`git checkout public/icon.svg public/icon-maskable.svg`).
2. **It rewrites `public/manifest.webmanifest`**, replacing the icon list with
   entries pointing at `../icons/...` — a path that escapes the web root and
   404s — and mislabels the WebP files as `image/png`. The committed manifest is
   the corrected version; do not accept the generated one.

Raster PWA icons are written to `./icons/` at the repo root and belong in
`public/icons/`.

### Screenshots

`docs/store/screenshots/` holds captures taken from the real static export at
exact store dimensions:

| Set | Pixels | Store requirement |
| --- | --- | --- |
| `ios-6.7-*` | 1290 × 2796 | App Store 6.7" iPhone |
| `android-phone-*` | 1080 × 1920 | Play phone |

Seven screens each: welcome, home, study, question, rationale, progress, plans.
Regenerate by serving `out/` on port 4321 and re-running the capture script.

**These are Chromium captures at device viewport, not captures from a physical
device.** Both stores accept them, but they cannot substitute for the on-device
testing in the launch readiness report.

---

## 4b. Account deletion endpoint

Apple guideline 5.1.1(v) requires in-app account deletion for any app offering
account creation. Source: `supabase/functions/delete-account/index.ts`.

```
POST https://<project-ref>.supabase.co/functions/v1/delete-account
Authorization: Bearer <the caller's own access token>
```

| | |
| --- | --- |
| Auth | Required. The user id is derived from the JWT and is **never** read from the body, so one user cannot delete another. |
| Body | None. |
| `200` | `{ "deleted": true }` |
| `401` | Missing bearer token, or invalid/expired session |
| `405` | Any method other than `POST` (`OPTIONS` returns 204 for CORS preflight) |
| `500` | Function not configured, or the delete failed |

**Environment** — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY` are injected by the Supabase runtime.
`ALLOWED_ORIGINS` must be set explicitly. Origins not on the list fall back to
the first entry, so a misconfigured caller fails closed rather than open.

**Data removed** — deleting the `auth.users` row is sufficient. `profiles`,
`attempts`, and `review_cards` each declare
`references auth.users (id) on delete cascade` in migration `0001_init.sql`
(verified at lines 62, 85, and 112), so the database clears every row belonging
to the user in the same transaction.

### Deploying

```bash
supabase functions deploy delete-account
supabase secrets set ALLOWED_ORIGINS="https://ai-governance-practice.vercel.app,capacitor://localhost,https://localhost"
```

`ALLOWED_ORIGINS` is a comma-separated list with no spaces. It must contain
every origin the app is served from:

| Origin | Needed for |
| --- | --- |
| `https://<your-vercel-domain>` | the web build |
| `capacitor://localhost` | the iOS WebView |
| `https://localhost` | the Android WebView |
| `http://localhost:3000` | local development, optional |

An origin missing from the list falls back to the first entry, so the browser
rejects the response and the delete button reports a network error rather than
silently deleting.

### Testing it end to end

Run this against the real project before submitting. It is the exact path an
App Store reviewer will exercise.

1. Sign up with a throwaway address and confirm the email.
2. Answer two or three scenarios so `attempts` and `review_cards` have rows.
3. In the SQL editor, note the user id and confirm the rows exist:
   ```sql
   select id from auth.users where email = '<test address>';
   select count(*) from public.profiles      where id      = '<user id>';
   select count(*) from public.attempts      where user_id = '<user id>';
   select count(*) from public.review_cards  where user_id = '<user id>';
   ```
4. In the app: Settings → Account → Delete account → confirm. Expect the app to
   return to a signed-out state with local progress cleared.
5. Re-run the four queries. **Every one must return 0 rows.**
6. Try to sign in with the same address and password. Expect
   "Invalid login credentials" — the account no longer exists.
7. Try to sign up again with the same address. It should succeed as a brand new
   account, proving nothing was left behind holding the email.

If step 5 returns rows, the cascade did not fire and the function deleted only
the auth record — stop and check the foreign keys in `0001_init.sql` before
submitting.

**Not yet deployed or executed.** The code is reviewed and the cascade is
verified against the schema and against PostgreSQL 16 locally, but the function
has never run against the live project, so the end-to-end path is unproven.

---

## 5. Remaining launch blockers

Ordered by what stops a submission.

1. **Deploy the `delete-account` edge function.** The UI and function source
   exist; the function is not deployed and could not be executed in this
   environment. Requires:
   ```bash
   supabase functions deploy delete-account
   supabase secrets set ALLOWED_ORIGINS="https://<your-domain>,capacitor://localhost,https://localhost"
   ```
   Then verify deletion end to end against a real project. **Until deployed,
   the delete button surfaces an error rather than deleting.**
2. **Hosted privacy policy and terms.** Reviewed copy at stable public URLs.
   The in-app pages are badged placeholders and describe real behaviour, which
   makes them a good drafting base — they are not reviewed legal copy.
3. **Real support address.** Change `SUPPORT` in `src/lib/brand.ts` to a
   monitored address and set `configured: true` to drop the placeholder badge.
4. **Set `NEXT_PUBLIC_SITE_URL`** and register it in Supabase redirect URLs.
5. **Test auth session persistence on a real device** (see 3.1). This is the
   one item that could still force a code change.
6. **Store icon and splash raster assets.** Generate from the existing mark
   with `@capacitor/assets` — do not redraw.
7. **Screenshots on real device frames.**
8. **Payments, if Pro ships as paid.** Both stores require their own in-app
   purchase for digital content; an external checkout is grounds for rejection.
   That means StoreKit / Play Billing, not Stripe, and a 15–30% cut on the
   $19–39 unlock. **Decide before pricing goes live.**

Items 1–4 and 6–7 are configuration and content. Item 5 is the only one that
might touch code, and item 8 is a business decision.
