# Mobile release

Assessment and checklist for shipping Judgment Labs to the App Store and Play
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
2. **Supabase auth redirects.** Email confirmation links point at a web URL. On
   device this needs either a deep link (`com.judgmentlabs.app://`) registered
   as a Supabase redirect URL, or magic-link sign-in. **Unresolved — see
   blockers.**
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
| App name | ✅ | Judgment Labs |
| Bundle / application ID | ✅ | `com.judgmentlabs.app` (set in `capacitor.config.ts`) |
| App icon | ⚠️ Partial | `public/icon.svg` exists. Stores need **raster PNG** at many sizes — 1024×1024 for App Store, adaptive icon for Play. Generate with `@capacitor/assets`. |
| Splash screen | ⚠️ Partial | Brand mark renders in-app at `/`. A **native** splash asset is still needed. |
| Privacy policy URL | ❌ Blocker | `/settings/privacy` is a placeholder describing actual behaviour. Both stores require a **publicly reachable URL** with reviewed copy. |
| Terms URL | ❌ Blocker | Same — `/settings/terms` is a placeholder. |
| Support contact | ❌ Blocker | No support email or URL exists anywhere in the product. Both stores require one. |
| Store description | ⚠️ Draft below | Not yet finalised. |
| Screenshots | ❌ | Required per device class: 6.7" and 5.5" iPhone, 12.9" iPad if iPad is supported; phone and tablet for Play. |
| Data safety / privacy nutrition labels | ⚠️ | Answers drafted below; must match actual behaviour. |
| Account deletion | ❌ Blocker (iOS) | Apple requires in-app account deletion for any app offering account creation. Settings currently offers *progress* reset and sign-out, **not account deletion**. |
| Age rating | ⚠️ | 4+ / Everyone. No objectionable content. |
| Export compliance | ⚠️ | Uses HTTPS only. Standard exemption applies; declare it. |

### Draft store description

> **Judgment Labs — AI Governance Practice for Practitioners**
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
| Account deletion offered | **Not yet — see blockers** |

---

## 3. Remaining launch blockers

Ordered by what stops a submission.

1. **Account deletion (iOS).** Apple rejects apps that create accounts without
   in-app deletion. Needs a Settings action calling a Supabase edge function
   that deletes the auth user and cascades progress. *Estimate: small.*
2. **Hosted privacy policy and terms.** Reviewed copy at stable public URLs.
   The in-app placeholders describe real behaviour and are a good starting
   draft, but they are not reviewed legal copy. *Estimate: legal review.*
3. **Support contact.** An email address or support URL, surfaced in Settings
   and in both store listings. *Estimate: trivial once the address exists.*
4. **Auth redirect on device.** Email confirmation currently returns to a web
   URL. Either register a deep link scheme with Supabase or switch to
   magic-link / OTP sign-in. *Estimate: small, but must be decided.*
5. **Store icon and splash raster assets.** Generate from the existing mark —
   do not redraw. *Estimate: trivial.*
6. **Screenshots on real device frames.** *Estimate: small.*
7. **Payments, if Pro ships as paid in-app.** Both stores require their own
   in-app purchase for digital content; an external checkout is grounds for
   rejection. This means StoreKit / Play Billing, not Stripe. **Decide before
   pricing goes live** — it changes the 15–30% economics of the $19–39 unlock.

Nothing on this list is architectural. The app itself is ready to package.
