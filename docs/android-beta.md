# Android beta — building and installing

The cheapest viable distribution path for this app. Android is the primary
platform; iOS and the App Store are deferred.

---

## Why this is essentially free

The app has **no server-side code**: zero route handlers, zero `"use server"`,
no API routes. Every page is a client component. `MOBILE_BUILD=1 next build`
emits a static bundle that Capacitor packages into the APK, so the app runs
entirely from local assets on the device.

Verified rather than assumed — the built bundle was driven through the complete
learning loop in a browser and **contacted zero external hosts**: onboarding,
answering scenarios, feedback, progress persisted across reload, and all eight
routes served. Nothing reached off-device.

| Component | Cost | Needed for the beta? |
| --- | --- | --- |
| Android app, all 82 scenarios, progress, review scheduling, analytics | £0 | Yes — this is the whole product |
| Google Play Console | $25 one-time | Only to distribute *through Play*. Direct APK install is free |
| Supabase | £0 on the free tier | No — optional, accounts only |
| GitHub Pages | £0 | No — the web build is a convenience, not a dependency |

Building the APK without Supabase credentials produces an app that never makes a
network call at all. That is the recommended beta configuration.

---

## Prerequisites

You need the Android SDK, which means installing **Android Studio** (free).
This repository's CI environment cannot install it — `dl.google.com` is blocked
by network policy — so the Gradle step must run on your machine.

```bash
# Confirm the toolchain once Android Studio is installed
echo $ANDROID_HOME      # should print a path
java -version           # 17 or newer
```

---

## Build a debug APK (fastest path to a device)

```bash
npm ci
npm run build:mobile          # static export into ./out
npx cap sync android          # copy the bundle into the Android project
cd android
./gradlew assembleDebug
```

The APK lands at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Debug builds are signed with a local debug key. That is fine for sideloading and
for sharing with testers directly; it is **not** acceptable for Play.

---

## Build a release APK or AAB (for Play, or for a signed share)

Create a keystore once and keep it safe — losing it means you can never update
the app under the same listing:

```bash
keytool -genkey -v -keystore nhid-release.keystore \
  -alias nhid -keyalg RSA -keysize 2048 -validity 10000
```

Put the credentials in `android/keystore.properties` (git-ignored — never commit
it):

```properties
storeFile=/absolute/path/to/nhid-release.keystore
storePassword=…
keyAlias=nhid
keyPassword=…
```

Then reference it from `android/app/build.gradle` in a `signingConfigs` block
and build:

```bash
cd android
./gradlew assembleRelease      # APK, for direct distribution
./gradlew bundleRelease        # AAB, required by Play
```

Outputs:

```
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Installing and testing

**Over USB**, with developer options and USB debugging enabled on the phone:

```bash
adb devices                   # confirm the phone is listed
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**By sideload**, without a cable: copy the APK to the phone, open it from the
file manager, and allow installation from unknown sources when prompted.

### What to check on the device

1. App name reads **AI Governance Practice** in the launcher, with the shield icon.
2. Onboarding runs, the disclaimer appears, and the Terms and Privacy links open.
3. Answer several scenarios — rationale and key takeaway appear each time.
4. Force-quit and reopen: **progress is still there**.
5. Turn on airplane mode and repeat step 3. Everything should still work.
6. Study screen reports **82 scenarios, all free** — nothing is gated.

---

## Offline on the web, without an APK

The web deployment registers a **network-first service worker** (`public/sw.js`,
no dependency). Once a visitor has loaded the app while online, it keeps working
with the network off — including after closing and reopening the browser.

| | Web (service worker) | Android APK |
| --- | --- | --- |
| Works offline after first visit | Yes | Yes, from first launch |
| Needs one online visit first | Yes | No |
| Updates | Automatic on next online load | Manual reinstall |
| Install friction | Add to Home Screen | Sideload warnings |
| Works on iPhone | Yes | No |

Network-first means an online user always gets the newest deployment; the cache
is only consulted when the network fails. Verified by deploying a changed build
and confirming an online client with a primed cache picked up the change.

**Not cached, deliberately:** anything cross-origin. Every Supabase auth and sync
call goes straight to the network or fails on its own terms — a cached auth
response would be both wrong and a security problem. Only `GET` requests are
intercepted at all.

Progress is untouched by any of this. It lives in `localStorage` and never
passes through the service worker.

The service worker is **not** registered in the mobile build. Capacitor already
serves every asset from the device, so a second caching layer would add nothing
and could serve stale assets after an app update. `NEXT_PUBLIC_MOBILE_BUILD`
gates it, and the mobile bundle contains no registration code at all.

---

## What still needs the internet

Only two things, and neither is required to study:

| Feature | Needs network | Notes |
| --- | --- | --- |
| Everything in the learning loop | **No** | Scenarios, rationales, progress, review scheduling, analytics are all local |
| Account sign-in and cross-device sync | Yes | Only if Supabase credentials are compiled in |
| Account deletion | Yes | Only reachable for accounts, which only exist if sign-in is enabled |

Build without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
the sign-in screen states that accounts are unavailable, the app works fully, and
no network call is ever made. The `INTERNET` permission in the manifest is the
Capacitor default; it can stay, and goes unused in that configuration.

---

## Can Supabase stay on the free tier?

For a beta, comfortably — if you turn accounts on at all.

The free tier allows 50,000 monthly active users, 500 MB of database, and pauses
a project after 7 days of inactivity. This app stores an email, a profile row,
one row per answered scenario, and one row per review card. A heavy user who
answered all 82 scenarios twice would occupy a few tens of kilobytes. Hundreds of
beta users would not approach 500 MB.

Two caveats worth knowing before you rely on it:

- **Free projects pause after a week of no activity.** For a low-traffic beta
  that means a tester can hit a dead backend. The app degrades gracefully — it
  falls back to local storage — but sign-in fails while paused.
- **The database is still empty.** `supabase/apply-all.sql` has not been run, so
  signup currently fails on a foreign key. Accounts do not work until it does.

Given both, the recommendation for the first beta is to **ship without Supabase**
and add accounts once there is a reason to want cross-device sync.
