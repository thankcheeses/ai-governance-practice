# Launch readiness report

Audit of NHID-Clinical against App Store and Play Store submission.

Companion document: [`mobile-release.md`](mobile-release.md) carries the
packaging detail, the `delete-account` endpoint contract, and the store
checklist.

---

## Status at a glance

### Complete

| Item | Evidence |
| --- | --- |
| Branding rename | `NHID-Clinical`, bundle id `org.nhidclinical.app`. Verified on regenerated native projects: Android `namespace`/`applicationId`/`app_name`, iOS `PRODUCT_BUNDLE_IDENTIFIER` on both configurations, `CFBundleDisplayName` |
| Legal documents | Terms (10 sections) and Privacy Policy (12 sections) naming NHID-Clinical and `contact@nhid-clinical.org`, with an effective date. Public at `/terms` and `/privacy`, no auth or onboarding gate |
| Pricing placeholders removed | Free / Professional / Enterprise. No plan implies a purchase is possible; Professional reads "Coming soon" because billing is not implemented |
| Asset cleanup | `public/visual-aids/components/` removed — 11 files, 3.6 MB, zero references. `public/` is 3.8 MB → 196 KB |
| Question validation | Answer leaks closed: 96% "B" → 18%, longest-is-correct 86% → 34%. Enforced by `npm run check:questions` |
| Builds passing | `lint`, `build`, `build:mobile`, `check:questions`, `tsc --noEmit` all exit 0 |
| Account deletion implemented | Settings → Account → Delete account, with confirmation. Edge function derives the user id from the caller's JWT; cascade verified against the schema and against PostgreSQL 16 |
| Store assets | Icons, splash, and 14 store-spec screenshots generated from the brand mark |

### Remaining

| Item | Why it blocks | Who can do it |
| --- | --- | --- |
| Apply database migrations | The database is empty. `profiles.active_track_id` has a foreign key to `tracks`, so **every signup fails** until `supabase/apply-all.sql` is run | You, in the SQL editor |
| `delete-account` testing | The function has never been deployed or executed. Apple reviewers exercise this path specifically | You, after deploying |
| Physical device test | Never run on real hardware. Session persistence across a cold start is the one risk that can still force a code change | You, with a device |
| App Store Connect setup | Bundle id registration, listing, screenshots, age rating, export compliance | You |

Nothing on the remaining list requires a code change to the app, with the
single exception of the session-persistence risk if it materialises.

---

## B. Blocking issues

Ordered by what stops a submission. Nothing here is architectural.

### B1. Store icons and splash — **resolved**

`scripts/build-store-assets.mjs` rasterises the existing shield in
`public/icon.svg` into the five sources `@capacitor/assets` consumes, producing
136 Android assets, 13 iOS assets, and the PWA icon set. Verified that
`mipmap-xxxhdpi/ic_launcher.png` renders the brand mark, not the Capacitor
placeholder.

Re-run after any change to the mark:
```bash
node scripts/build-store-assets.mjs && npx capacitor-assets generate
```
That generator deletes `public/icon.svg` and rewrites the web manifest — see
`mobile-release.md` §4a for what to restore afterwards.

### B2. `delete-account` edge function is not deployed — **hard blocker (iOS)**

Apple guideline 5.1.1(v) requires in-app account deletion. The UI and function
source both exist, but the function has never been deployed or executed.
**Today the delete button surfaces an error rather than deleting.**

```bash
supabase functions deploy delete-account
supabase secrets set ALLOWED_ORIGINS="https://<domain>,capacitor://localhost,https://localhost"
```
Then delete a real test account end to end and confirm the rows are gone.

### B3. Privacy policy and terms — **resolved in code, needs a live domain**

Both stores require a reachable URL. `/settings/privacy` and `/settings/terms`
exist and are correctly badged "Placeholder" (verified), and they describe the
app's real data behaviour — a good drafting base, but not reviewed legal copy.

### B4. Support contact — **resolved**

**Resolved.** The placeholder address is gone; `COMPANY` in `src/lib/brand.ts`
now carries `contact@nhid-clinical.org`, and the in-app placeholder badges were
removed with it.

### B5. Screenshots — **resolved**

`docs/store/screenshots/` holds 14 captures taken from the real static export at
exact store dimensions: 1290×2796 for App Store 6.7", 1080×1920 for Play phone,
seven screens each. They are Chromium captures at device viewport — both stores
accept them, but they do not substitute for on-device testing.

Still needed if you support iPad: a 12.9" set.

### B6. In-app purchase — **blocks a paid launch only**

Both stores require *their* IAP for digital content; an external checkout is
grounds for rejection. That means StoreKit / Play Billing, not Stripe, and a
15–30% cut on the $19–39 unlock.

**This is a business decision before it is an engineering one.** Launching Free
only, with Pro disabled, removes this blocker entirely and is the faster path.

### B7. Never run on a physical device — **must do before submitting**

Everything is verified in a desktop Chromium at mobile viewport and against the
static bundle. That is not the same as a real WebView. Specifically unverified:
Supabase session persistence across cold starts (see B8), safe areas on a
notched device, and large OS font scaling against the fixed question layout.

### B8. Supabase session storage on iOS — **the one risk that could force code**

`getBrowserSupabase()` uses `createBrowserClient` from `@supabase/ssr`, which
persists the session in **cookies**. Correct for web, where middleware reads the
same cookie. In an iOS WebView, cookie persistence across cold starts is
historically the fragile part.

Deliberately not changed — swapping the client factory alters the web
middleware contract, which is architecture. If device testing shows session
loss, the fix is a `localStorage`-backed storage adapter for the mobile target
only.

---

## C. Non-blocking improvements

Worth doing, none stop a submission.

1. **Supplied diagrams are AI-generated clipart.** The two wired VisualAids are
   the least premium surface in the app and clash with the enterprise aesthetic.
   Swapping them is a file replace, no code change.
2. **Free tier has no visual scenarios.** Both diagram-carrying questions (19,
   45) sit outside the first 20, so free users never see the feature Pro
   advertises. Moving one into the free window would demonstrate it.
3. **Age rating and export compliance** need declaring at submission: 4+ /
   Everyone; HTTPS-only so the standard encryption exemption applies.
4. **No analytics.** Correct for a privacy-clean data-safety declaration, but
   you will launch blind to funnel and retention. A deliberate trade to make
   consciously.
5. **`npm audit` reports vulnerabilities** in the dependency tree. None are
   reachable from app code, but worth a look before launch.
6. **Store listing copy** is drafted in `mobile-release.md` but not finalised.
   The disclaimer paragraph is not optional — both stores police implied
   certification affiliation.

---

## D. Testing on a real device

Prerequisites the CI environment cannot provide: Android Studio + SDK, and
macOS + Xcode.

### Android

```bash
npm run build:mobile          # static export → ./out
npx cap add android           # first time only  (verified: scaffolds cleanly)
npx cap sync android
npx cap open android          # opens Android Studio
```
Then: enable Developer Options and USB debugging on the phone, connect it,
select it in the Studio toolbar, and press Run. For a shareable build,
**Build → Generate Signed Bundle / APK**.

Verified already: the scaffold produces `applicationId org.nhidclinical.app`,
app name "NHID-Clinical", and all 15 HTML routes plus both diagrams land in
`android/app/src/main/assets/public/`.

### iPhone

```bash
npm run build:mobile
npx cap add ios               # first time only  (verified: scaffolds cleanly)
npx cap sync ios
npx cap open ios              # opens Xcode
```
Then: in **Signing & Capabilities** select your Apple Developer team, connect
the iPhone, choose it as the run destination, press Run. The device must trust
the developer certificate under **Settings → General → VPN & Device Management**.

Verified already: `PRODUCT_BUNDLE_IDENTIFIER = org.nhidclinical.app`,
`CFBundleDisplayName = NHID-Clinical`, 15 HTML routes in `ios/App/App/public/`.

**Note:** `android/` and `ios/` are gitignored. They are generated output —
regenerate rather than commit them.

### What to check on device, in priority order

1. Sign in, force-quit, reopen — **is the session still there?** (blocker B8)
2. Safe areas on a notched device: question text and the bottom action bar
3. OS font size at maximum — does the question layout overflow?
4. Answer a question offline — the bundle is local, so it should work
5. Account deletion end to end, after deploying the edge function
6. Back-gesture behaviour on Android from a study session

---

## E. Recommended order of operations

Sequenced so nothing is done twice and the cheap blockers clear first.

**Phase 1 — decide (before any work)**
1. Free-only launch, or paid Pro? This determines whether B6 (IAP) is in scope
   and is the single biggest fork in the schedule. *Recommendation: launch Free
   only.* It removes the largest blocker, and the entitlement architecture
   already supports flipping Pro on later with no restructuring.
2. Register the real support address and the domain that will host legal pages.

**Phase 2 — cheap blockers (hours)**
3. Set `SUPPORT` in `src/lib/brand.ts`, flip `configured: true`. *(B4)*
4. Generate icons and splash with `@capacitor/assets` from the existing mark. *(B1)*
5. Set `NEXT_PUBLIC_SITE_URL`; add it to Supabase → Authentication → Redirect URLs.

**Phase 3 — deploy the backend (hours)**
6. Run migrations `0001` and `0002` against the production project.
7. Deploy `delete-account`, set `ALLOWED_ORIGINS`, delete a test account end to
   end. *(B2)*

**Phase 4 — device validation (a day)**
8. `cap add` both platforms, run on a real Android phone and a real iPhone.
9. Work the priority checklist in section D. **If B8 bites, fix it here** —
   before assets and screenshots, because it is the only item that can still
   change code.

**Phase 5 — store content (days, gated on legal)**
10. Reviewed privacy policy and terms at public URLs. *(B3)*
11. Screenshots from the real device builds. *(B5)*
12. Finalise listing copy, keeping the disclaimer paragraph intact.

**Phase 6 — submit**
13. Play first. Review is faster, so it surfaces problems while App Store review
    is still queued.
14. App Store, with the account-deletion path ready to demonstrate — reviewers
    check that one specifically.

---

## Evidence behind this report

Everything above was verified in this pass, not inferred:

- `tsc --noEmit`, `eslint`, `npm run build`, `npm run build:mobile` — all clean
- All 13 routes return 200 as flat files with no server
- 51/51 UI flow checks: onboarding, study, answer, feedback, persistence,
  upgrade, Pro unlock, settings, theme, legal placeholders
- 28/28 entitlement checks run against the real modules, including that an
  unknown tier fails closed to free
- `npx cap add android` and `npx cap add ios` both scaffold cleanly, with the
  correct bundle identifier, display name, and all web assets copied
- `@capacitor/assets` confirmed to exist at v3.0.5

Not verified, and stated as such: anything requiring a physical device, a
deployed Supabase project, or a store account.
