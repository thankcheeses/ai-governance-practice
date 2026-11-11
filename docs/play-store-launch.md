# Getting AI Governance Practice onto Google Play

A plain checklist, in order. It assumes no developer account yet and no Android
tools installed. The technical background is in
[`android-beta.md`](android-beta.md) and [`mobile-release.md`](mobile-release.md);
this page is only what to do.

Rules and fees below were checked against Google's own help pages in November
2026. Google changes them, so each step links to the page that is the authority.

---

## The timeline, honestly

A brand-new personal developer account cannot publish straight to the store.
Google requires a **closed test with at least 12 testers, opted in for 14 days
in a row**, before it will let you apply for a public release
([Google's rule](https://support.google.com/googleplay/android-developer/answer/14151465)).

So the fastest realistic path is roughly:

| When | What |
| --- | --- |
| Day 1 | Create the developer account, pay $25, start identity verification |
| Day 1–3 | Google verifies your identity |
| Day 3 | Upload the first build to a closed test, invite 12+ testers |
| Day 3–17 | The 14 days run. Testers must stay opted in the whole time |
| Day 17+ | Apply for production access; Google reviews the app |

Plan for about three weeks. The 14 days cannot be shortened, so the single most
useful thing to do early is **line up your 12 testers** — friends, colleagues,
study-group members — anyone with an Android phone and a Google account.

An **organization** account (a registered business with a D-U-N-S number) is
exempt from the 12-tester rule. If NHID-Clinical is a registered entity, that
route may be quicker; it needs business documents instead of testers.

---

## Step 1 — Create the developer account

1. Go to <https://play.google.com/console/signup>.
2. Choose **Personal** (or **Organization**, see above).
3. Pay the one-time **$25** registration fee.
4. Complete identity verification. Google asks for a government ID and may ask
   you to verify a phone number and an Android device.

Use a Google account you will keep. The developer account is tied to it.

## Step 2 — Create the app in the Play Console

1. **Create app** → name: `AI Governance Practice` → App → Free.
2. The package name must be exactly **`org.nhidclinical.app`**. It is fixed in
   `capacitor.config.ts` and can never be changed after the first upload.
3. Fill in the store listing. The pieces already exist in this repository:

| Play Console asks for | Where it is |
| --- | --- |
| Short and full description | `docs/mobile-release.md`, "Draft store description". Keep the not-affiliated paragraph; it is not optional. |
| Phone screenshots | `docs/store/screenshots/android-phone-*.png` (1080 × 1920) |
| App icon, 512 × 512 | `public/icons/icon-512.png` |
| Feature graphic, 1024 × 500 | **Not made yet.** Ask for one to be generated. |
| Privacy policy URL | The app's privacy page on the live site |
| Data safety form | `docs/mobile-release.md`, "Data disclosure answers" |
| Content rating | Fill in the questionnaire; the honest answers give "Everyone" |
| Support email | `contact@nhid-clinical.org` — make sure someone reads it |

## Step 3 — Create the upload key (once, and keep it safe)

Google Play only accepts builds signed with your key. Make it once:

```bash
keytool -genkey -v -keystore upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

`keytool` comes with Java. If you do not have Java, Android Studio can do the
same thing from a menu: **Build → Generate Signed App Bundle → Create new**.

It asks you to choose a password. Then:

- **Back up `upload.keystore` and its password somewhere safe** (a password
  manager). With Play App Signing on — the default — a lost upload key can be
  reset by Google support, but it costs days.
- **Never commit the keystore or put the password in a chat, an issue or an
  email.**

Then give the key to the build, as four repository secrets. On GitHub:
**Settings → Secrets and variables → Actions → New repository secret**.

| Secret name | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The keystore file, base64-encoded: run `base64 -w0 upload.keystore` (macOS: `base64 -i upload.keystore`) and paste the output |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password you chose |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | The key password (the same as the keystore password unless you set a different one) |

## Step 4 — Build the app (no Android tools needed)

The **Android build** workflow builds the app on GitHub's machines.

1. On GitHub: **Actions → Android build → Run workflow**.
2. When it finishes, open the run and download from **Artifacts**:
   - `ai-governance-practice-debug-apk` — install this on a phone to try the
     app. Google Play does not accept it.
   - `ai-governance-practice-release-aab` — **this is the file you upload to
     Google Play.** It only appears once the four secrets from step 3 are set.

Each run gets a higher version number automatically, which Play requires.

## Step 5 — Run the closed test

1. Play Console → **Testing → Closed testing → Create new release**.
2. Upload the `.aab` from step 4. Accept **Play App Signing** when offered.
3. Add your testers' Google account emails to a tester list.
4. Send them the opt-in link the console gives you. Each tester must open the
   link, accept, and install the app from Play.
5. Wait until the console shows **12 testers opted in for 14 days**.

Check on a real phone while you wait — the list is in
`docs/android-beta.md`, "What to check on the device".

## Step 6 — Go public

1. Play Console → **Apply for production access**. It asks a few questions
   about your test.
2. Once approved, create a production release with the same `.aab` (or a newer
   one) and submit it for review.

---

## Charging money

Today the app is **free, with nothing locked**, and it says so on its landing
page and study screen. Charging is a product decision before it is a technical
one. The options:

| Model | How it works | What it takes |
| --- | --- | --- |
| **Free** (today) | Nothing to buy | Nothing |
| **Paid app** | One price to download | A setting in the Play Console. No code. But a free app can never be switched to paid later — it would have to be a new listing. |
| **One-time unlock** | Free to try, pay once for the full bank or extras | Google Play Billing built into the app, and a decision about what is free |
| **Subscription** | Monthly or yearly | Google Play Billing, plus handling renewals and cancellations |

What applies to all the paid options:

- **Digital content sold inside an Android app must go through Google Play
  Billing.** A link to an outside checkout for the same content is not allowed
  in most countries.
- **Google keeps a service fee** on each sale. The rates changed in 2026 and
  depend on the programme and your yearly earnings, so read
  [Google's current fee page](https://support.google.com/googleplay/android-developer/answer/112622)
  rather than trusting a number written here.
- **You need a payments profile** in the Play Console (bank account and tax
  details) before you can be paid.
- **The app's own wording has to change first.** "Free, with no paid tier" on
  the landing page, "all free" on the study screen, the store description, the
  privacy page ("no payment data") and the data safety form would all be untrue
  the day a price exists.
- **Billing is not built.** There is no purchase code in the app today. Adding
  it is real work: a purchase screen, restoring purchases on a new phone, and
  checking that a purchase is genuine.

A sensible order: launch free, get the 12 testers and real users, then decide
what people would pay for.

---

## iPhone

Apple is separate: a **$99 per year** developer account, a Mac with Xcode to
build, and its own review. The app is already configured for it
(`docs/mobile-release.md`), but nothing here builds it yet. Android first.

## The other apps

- **AI Governance Map** is a website. It can be packaged for Play the same way
  as this app (Capacitor around a static build), but it needs the same account,
  the same tester period for each new app, and its own listing.
- **nhid-clinical.org** is a project website, not an app; a store listing would
  add nothing a browser does not already do.
