# Launch readiness report

Audit of Judgment Labs against App Store and Play Store submission. No features
were added and no architecture changed during this pass — this is an assessment
plus the evidence behind it.

Companion document: [`mobile-release.md`](mobile-release.md) carries the
packaging detail and store checklist.

---

## A. Readiness score: 68 / 100

The score answers "can this be submitted to the stores today?", not "is the app
good?". Those diverge sharply here.

| Area | Score | Basis |
| --- | --- | --- |
| App functionality and quality | 95 | 51/51 flow checks and 28/28 entitlement checks pass; zero JS errors; zero failed requests |
| Entitlement / monetization architecture | 90 | Boundary tested directly, fails closed on unknown tier. Loses points only because no purchase path exists |
| Mobile packaging | 80 | Static export verified; **both** native platforms scaffold with correct bundle id and assets. Never built or run on a device |
| Store assets | 25 | No raster icons, no splash, no screenshots. Launcher icons are still Capacitor's generic placeholder |
| Legal and compliance | 45 | Deletion implemented but undeployed; privacy, terms, and support are badged placeholders |
| Payments | 0 | No IAP. Blocks a paid launch only |

**Read this as:** the product is close to done; the *submission package* is not.
Every remaining blocker is configuration, content, or an account you have to
own — none require code changes to the app itself.

---

## B. Blocking issues

Ordered by what stops a submission. Nothing here is architectural.

### B1. Store icons and splash are Capacitor defaults — **hard blocker**

`npx cap add android` produced 20 launcher icon files, all still the generic
Capacitor logo. Submitting with these fails review and, if it passed, would ship
someone else's mark as your brand.

Only `public/icon.svg` exists. Stores need raster PNG: 1024×1024 for App Store,
adaptive foreground/background for Play, and a native splash for both.

Fix — generate from the **existing** mark, do not redraw:
```bash
npm i -D @capacitor/assets            # verified to exist, v3.0.5
# place a 1024x1024 icon.png and 2732x2732 splash.png in ./assets
npx capacitor-assets generate
```

### B2. `delete-account` edge function is not deployed — **hard blocker (iOS)**

Apple guideline 5.1.1(v) requires in-app account deletion. The UI and function
source both exist, but the function has never been deployed or executed.
**Today the delete button surfaces an error rather than deleting.**

```bash
supabase functions deploy delete-account
supabase secrets set ALLOWED_ORIGINS="https://<domain>,capacitor://localhost,https://localhost"
```
Then delete a real test account end to end and confirm the rows are gone.

### B3. Privacy policy and terms need public URLs — **hard blocker**

Both stores require a reachable URL. `/settings/privacy` and `/settings/terms`
exist and are correctly badged "Placeholder" (verified), and they describe the
app's real data behaviour — a good drafting base, but not reviewed legal copy.

### B4. Support contact is a placeholder — **hard blocker**

`support@judgmentlabs.example` is not a real domain. Both stores require a
working support channel. One line: `SUPPORT` in `src/lib/brand.ts`, then set
`configured: true` to drop the in-app badge.

### B5. Screenshots — **hard blocker**

None exist. Required per device class: 6.7" and 5.5" iPhone (plus 12.9" iPad if
iPad is supported), phone and tablet for Play.

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

Verified already: the scaffold produces `applicationId com.judgmentlabs.app`,
app name "Judgment Labs", and all 15 HTML routes plus both diagrams land in
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

Verified already: `PRODUCT_BUNDLE_IDENTIFIER = com.judgmentlabs.app`,
`CFBundleDisplayName = Judgment Labs`, 15 HTML routes in `ios/App/App/public/`.

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
