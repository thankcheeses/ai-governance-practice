/**
 * Terms and Privacy Policy content.
 *
 * Data only, so the same text can render at two places without drifting:
 *  - `/terms` and `/privacy` — public, no gate, for the store listings
 *  - `/settings/terms` and `/settings/privacy` — in-app, inside the shell
 *
 * Every clause describes what the app actually does and is checkable against
 * the code. Change behavior and this text has to change with it.
 */
import { BRAND, COMPANY, LEGAL_EFFECTIVE_DATE, SUPPORT } from "@/lib/brand";

export interface LegalSection {
  heading: string;
  body: string;
}

export { LEGAL_EFFECTIVE_DATE };

export const TERMS_SUMMARY = `These terms govern your use of ${BRAND.name}, published by ${COMPANY.name}. By creating an account or continuing to use the app, you agree to them.`;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "Nature of the service",
    body: `${BRAND.name} is an independent educational product that provides original scenario-based learning materials for professional development in AI governance. It is published by ${COMPANY.name}, ${COMPANY.descriptor}.\n\nThis product is not affiliated with, endorsed by, sponsored by, or connected to the International Association of Privacy Professionals (IAPP), CompTIA, Cloud Security Alliance, or any other certification body. It does not contain actual certification examination questions and does not guarantee any examination result or certification outcome.\n\nAll questions, scenarios, rationales, key takeaways, and related content are original educational material created solely for practice and learning purposes.`,
  },
  {
    heading: "Educational purpose — not professional advice",
    body: "Content is provided for training only. It is not legal, regulatory, medical, clinical, security, or compliance advice, and no professional relationship is created by using it. Do not rely on it to make a real governance, clinical, or compliance decision. Consult primary regulatory sources and qualified counsel for those.",
  },
  {
    heading: "No guarantee of regulatory compliance",
    body: "Using this app does not make you, your employer, or any system you operate compliant with the EU AI Act, HIPAA, GDPR, ISO/IEC 42001, the NIST AI RMF, or any other law, framework, or standard. Frameworks are referenced to describe subject matter. Their names and texts belong to their respective owners, and this product is not affiliated with, endorsed by, or certified against any of them.",
  },
  {
    heading: "Intellectual property and restrictions",
    body: `All content available through the service — including questions, scenarios, rationales, explanations, text, software, and related materials — is the intellectual property of ${COMPANY.name} and is protected by applicable copyright and intellectual property laws.\n\nYou may use the content only for your personal, non-commercial educational purposes.\n\nYou may not: copy, reproduce, distribute, or publicly display the content in bulk; scrape, harvest, crawl, or systematically extract the question bank or related materials; use the content to train a machine learning model; sell, license, sublicense, or otherwise commercially exploit the content; create derivative works intended for commercial distribution or resale; or remove, obscure, or alter any copyright or proprietary notices.\n\nUnauthorized commercial use, redistribution, or bulk extraction of the content is strictly prohibited.`,
  },
  {
    heading: "Acceptable use",
    body: "You agree to use the service only for lawful personal educational purposes. You may not use the service in any way that could damage, disable, overburden, or impair it, or interfere with any other person's use of the service. Automated bulk extraction or scraping is not permitted. Do not attempt to breach authentication, access another user's data, probe or disrupt the service, or submit unlawful content. Do not present this content as certification exam material or as the output of any certification body.",
  },
  {
    heading: "Accounts and data",
    body: "An account is optional — the app works without one and keeps progress on your device. If you create one, you are responsible for safeguarding your credentials and for activity under your account, and you must be old enough to form a binding contract where you live. Progress may be stored locally on your device and, if you sign in, synchronised to our systems. You may delete your account and associated data through the in-app account deletion function. Tell us promptly at the address below if you believe your account has been accessed without your permission.",
  },
  {
    heading: "Price",
    body: "The service is free. There are no paid plans, no subscriptions, and no locked features — every scenario, the review queue, and the progress analytics are available to everyone. No payment processing exists, no charge is taken, and no payment details are collected. If that ever changes, the terms will change with it and the change will be presented for acceptance before any charge.",
  },
  {
    heading: "Disclaimer of warranties",
    body: `The service and all content are provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, accuracy, and non-infringement. We do not warrant that the service will be uninterrupted or error-free, or that the content will produce any particular examination or certification result.`,
  },
  {
    heading: "Limitation of liability",
    body: `To the maximum extent permitted by law, ${COMPANY.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or data, arising out of or related to your use of the service. The service is free, so our total aggregate liability arising out of or relating to it is limited to fifty US dollars — a nominal sum stated so the limit has substance rather than resolving to nothing. Nothing here excludes liability that cannot lawfully be excluded.`,
  },
  {
    heading: "Termination",
    body: "You may stop using the service at any time and delete your account from Settings → Account, which permanently removes your account and associated progress. We may suspend or terminate access for breach of these terms, for unlawful use, or where required by law — in most cases with notice, and immediately where the conduct is serious or ongoing. Provisions on acceptable use, disclaimers, and liability survive termination.",
  },
  {
    heading: "Changes",
    body: "This is a public beta. Features may change or be withdrawn, availability is not guaranteed, and progress data may need to be migrated as the product develops. We may update these Terms from time to time; the effective date above will change, material updates will be surfaced in the app, and continued use after changes are posted constitutes acceptance of the revised Terms.",
  },
];

export const PRIVACY_SUMMARY = `How ${COMPANY.name}, publisher of ${BRAND.name}, handles your data. Every statement below describes what the app does today, not what it may do later.`;

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "Who we are",
    body: `${COMPANY.name} is ${COMPANY.descriptor} and is the controller of the personal data described here.`,
  },
  {
    heading: "Using the app without an account",
    body: "No account is required. Used signed out, none of your learning data leaves your device: your answers, review schedule, streak, daily goal, and theme stay in your browser's local storage and are never transmitted to us. The one thing that is sent is pseudonymous usage measurement, described below — it carries no account, no name, and nothing about which answer you gave, but it does carry a rotating device identifier, and you can switch it off in Settings.",
  },
  {
    heading: "What we collect if you create an account",
    body: "Your email address, and your learning progress: which scenarios you answered, the option you chose, whether it was correct, how long you took, your self-reported confidence, your review schedule, and your streak. We do not ask for your name, employer, job title, or any health information, and you should not enter patient data, protected health information, or confidential material anywhere in the app.",
  },
  {
    heading: "What we never collect",
    body: "No third-party analytics or advertising SDK is present in the app. No advertising identifiers, no third-party trackers, no cross-site tracking, no device fingerprinting, no precise or GPS location, no IP addresses in storage, and no payment details — there is no checkout. We do not sell or share personal data, and we do not use your data to train machine learning models. The usage measurement described in the next section is our own, is not linked to any account, and is never combined with your learning data.",
  },
  {
    heading: "Pseudonymous usage measurement",
    body: "We count how the app is used so we know whether it is worth maintaining. This data is pseudonymous rather than anonymous, and the difference matters: a random identifier is stored on your device, replaced every 90 days, and sent with each record, so records from one device can be grouped together within that window. It is not an account and is not joined to one — signed in and signed out produce the same record — but we do not claim it makes you unidentifiable, and you should not read it that way. We record which kind of session you started, which Body of Knowledge domain and sub-domain a question belonged to and whether it was answered correctly. Coarse technical context is inferred from the connection rather than reported by the app: a country and — in the United States only — a state, whether the device is a phone, tablet or desktop, and your browser and operating system family. Your IP address is used momentarily to work out the country and is then discarded; it is never written to our database, and there is no field in which it could be stored.",
  },
  {
    heading: "If you report a problem",
    body: "The Help page has a form for telling us something is wrong. It sends what you typed, which kind of problem you picked, and the path of the page you were on — the path only, never the query string after it. An email address is optional: give one if you want a reply, leave it blank and the report is anonymous. No account is needed to send a report, and nothing is attached to your account even when you are signed in — the report carries no user id and is never joined to your learning data or to usage measurement. Reports are readable only by the operator of this site. Unlike usage records, they are not deleted on a schedule: a report is kept so the same problem is not investigated twice, and so a fix can be traced back to what prompted it. Please do not include patient data, protected health information, or anything confidential in a report.",
  },
  {
    heading: "What usage measurement never includes",
    body: "It never includes your email address or user id, even when you are signed in — a signed-in and a signed-out visit produce identical records. It never includes which question you saw, which option you chose, your score, your streak, or any free text. It is stored separately from learning data, with no link between the two, so the two cannot be combined. Individual records are never inspected: only aggregated daily totals are read, and the raw records are deleted after 90 days.",
  },
  {
    heading: "Turning usage measurement off",
    body: "Settings → Privacy has a switch that disables it. With it off, nothing is sent at all — the request is not made, rather than made and discarded. The app works identically either way, and studying never depends on this being available: if the measurement service is unreachable, blocked by your browser, or switched off, the app behaves exactly the same.",
  },
  {
    heading: "Where your data is stored",
    body: "Account data is stored in Supabase, our hosted database and authentication provider, which processes it on our behalf under contract. Every progress row is protected by row-level security keyed to your user id, so one account cannot read another's data. Traffic is encrypted in transit over HTTPS. The app itself is a set of static files served by GitHub Pages, which processes standard request logs as our hosting provider.",
  },
  {
    heading: "Why we process it, and on what basis",
    body: "Your email exists to authenticate you and to contact you about your account. Progress data exists to deliver the product you asked for: tracking what you have completed and scheduling reviews. We process it to perform our contract with you under the Terms of Service. We do not use it for marketing or profiling.",
  },
  {
    heading: "How long we keep it",
    body: "For as long as your account exists. Deleting your account removes it immediately and permanently. Data held only on your device persists until you clear it or uninstall the app.",
  },
  {
    heading: "Deleting your data",
    body: "Settings → Data → Reset progress clears your answers and review schedule. Settings → Account → Delete account permanently deletes your account and every progress record attached to it; deletion cascades from your authentication record, so nothing is left behind, and it cannot be undone. Signing out clears the local copy on that device.",
  },
  {
    heading: "Your rights",
    body: "Depending on where you live, you may have rights to access, correct, export, restrict, or erase your personal data, to object to processing, and to complain to your data protection authority. Deletion is available directly in the app; for anything else, write to us and we will respond within the period the applicable law requires.",
  },
  {
    heading: "Children",
    body: "The app is intended for working professionals and is not directed at children. We do not knowingly collect personal data from anyone under 16. If you believe a child has created an account, contact us and we will delete it.",
  },
  {
    heading: "Health and AI governance context",
    body: "Scenarios reference healthcare, clinical, and AI risk situations because that is the subject being taught. They are fictional teaching material. We are not a covered entity or a business associate under HIPAA, we do not process protected health information, and nothing in the app should be used to record or transmit real patient data.",
  },
  {
    heading: "Changes to this policy",
    body: "If we change how data is handled, the effective date above will change and material changes will be surfaced in the app before they take effect.",
  },
];

/**
 * Accessibility statement.
 *
 * Held to the same rule as the two documents above: every sentence describes
 * what the app does today and is checkable against the code.
 *
 * It deliberately makes **no conformance claim**. Saying "WCAG 2.1 AA
 * compliant" or "ADA compliant" is a legal conclusion that rests on an audit
 * nobody has performed on this app, and in a product about governance a
 * confident unverified compliance claim would be the exact failure it teaches
 * learners to spot. So the wording names the standard it is built toward, maps
 * individual features to the criteria they answer, states plainly that no
 * audit has happened, and lists the gaps it knows about.
 */
export const ACCESSIBILITY_SUMMARY = `What ${BRAND.name} does today to be usable with assistive technology, which parts are known to fall short, and how to tell us about a barrier. This describes the current state of the app — it is not a certificate of conformance and not legal advice.`;

export const ACCESSIBILITY_SECTIONS: LegalSection[] = [
  {
    heading: "The standard this is built toward",
    body: "The target is WCAG 2.1 Level AA, the version referenced by Section 508 in the United States and by EN 301 549 in the European Union. Specific features below name the success criterion they answer. No independent accessibility audit has been carried out on this app, and no automated checker has been run as a gate on every release, so nothing here should be read as a conformance claim — a conformance claim without an audit behind it is exactly the kind of unverified assertion this app exists to teach people to question. What follows is an honest account of what has been built and tested, and of what has not.",
  },
  {
    heading: "Reading questions aloud",
    body: "Every question screen has a Read aloud control that speaks the scenario, the question and each answer choice in the order they appear. It uses your browser's own speech synthesis, with the voices already on your device, so it costs nothing and needs no account. On-device voices are preferred automatically and nothing you read leaves your device. Some browsers, Chrome in particular, also offer network voices in the same list; those are labelled as such in the voice picker, and choosing one sends the text being read to that voice's provider. Nothing selects one for you. If your device has no speech voices installed, the control says so rather than appearing to work: adding a voice in your system settings enables it, and nothing needs to change in the app. Read-aloud is available in exam mode as well as in practice, because a reading accommodation that disappears under timed conditions is not an accommodation.",
  },
  {
    heading: "Speed and voice",
    body: "Reading speed is adjustable from 0.5× to 2× in seven steps, and the choice is remembered on that device. You can also choose which installed voice reads, grouped by language, or leave it to match the page. Speed and voice changes take effect on the next read rather than mid-sentence, because no speech engine can change rate part-way through an utterance; the control stops rather than pretending otherwise. Each passage is spoken as a separate piece, so stopping is immediate and long scenarios are not cut off part-way, which is a real limitation of some browsers on a single long passage.",
  },
  {
    heading: "Other languages",
    body: "Settings has a reading-language picker covering the languages most spoken at home in the United States \u2014 Spanish, Chinese, Tagalog, Vietnamese, Arabic, French, Korean, Russian, Portuguese, Haitian Creole and Hindi \u2014 plus German and Japanese, which are on the list because this subject's source material is published in them. Choosing one shows you, written in that language, that the questions are in English, how to read the page in your language using your browser's own translation, and whether this device has a read-aloud voice for it. Read aloud then speaks whatever is on screen, so a translated page is read back translated. What the picker deliberately does not do is translate the app itself or change the page's language attribute: the attribute states what language the text is, and marking English text as Spanish would make a screen reader pronounce English words with Spanish phonics, which is worse than leaving it alone. The questions are written and stored in English only, and this app does not translate them \u2014 they turn on legal obligations where terms like controller, provider, deployer and substantial modification carry specific meanings that already have official renderings in other languages, and an unreviewed machine translation would quietly teach the wrong word while reading perfectly fluently. The short notes in the picker are themselves unreviewed translations, which is acceptable only because they are three practical sentences about a browser feature with no legal or exam content in them. If a reviewed translation into a particular language would be useful to you, say so through the Help page."
  },
  {
    heading: "Text size and spacing",
    body: "Settings offers four text sizes up to 1.5× (WCAG 2.1 §1.4.4, Resize Text). Browser zoom already satisfies that criterion and keeps working; the in-app control exists because it is discoverable and zoom is not. There is also a wider text spacing setting that applies exactly the values named in WCAG 2.1 §1.4.12 — line height 1.5×, letter spacing 0.12em, word spacing 0.16em and paragraph spacing 2× — to the app's reading-width prose. Both preferences are applied before the page first paints, so a stored setting is never shown at the wrong size first, and both are stored on the device rather than on an account, so they work before and whether or not you ever sign in.",
  },
  {
    heading: "Motion",
    body: "The app honours your operating system's reduced-motion setting. Settings also has its own Reduce motion switch (WCAG 2.1 §2.3.3, Animation from Interactions) for turning animation off here without changing your whole system. Nothing in the app flashes, blinks, auto-plays video, or moves without you starting it, and there is no carousel or auto-advancing content.",
  },
  {
    heading: "Keyboard and screen readers",
    body: "Every control is reachable and operable by keyboard, answer choices are real buttons with radio or checkbox semantics and a checked state, and the study screen has keyboard shortcuts for answering and moving on. Results and feedback appear in live regions so they are announced rather than silently replacing what was there. Correctness is never signalled by colour alone: the marker's shape changes and the outcome is also stated in words. Multi-select questions state how many choices are required before you answer, in one sentence a screen reader reads as a sentence.",
  },
  {
    heading: "A trade-off we made against you, stated plainly",
    body: "Question text and answer choices cannot be selected or copied. This is friction against pasting a question straight into a chatbot, and it is a speed bump rather than protection — a screenshot or retyping defeats it. It does not affect screen readers, which read the accessibility tree rather than the selection, and it does not affect browser translation or read-aloud. What it does cost is selecting text while reading, which some people rely on to hold their place on a long passage. That is a genuine accessibility cost, accepted knowingly, and confined to the question and its options: explanations, rationales, takeaways, labels and controls are all freely selectable.",
  },
  {
    heading: "Known gaps",
    body: "No independent audit or formal assistive-technology test pass has been done, so there are almost certainly barriers nobody has found yet. Specifically untested: screen magnification above 400%, Windows High Contrast and forced-colours modes, braille displays, and voice-control software. Read-aloud depends on voices your device has installed and on your browser's speech support, neither of which the app can supply. Diagrams carry text labels as real text, but the decorative illustrations are not individually described. The downloadable PDF report has not been checked for tagged-PDF accessibility. This list is what is known; it is not a guarantee that the rest is fine.",
  },
  {
    heading: "Telling us about a barrier",
    body: `If something stops you using this app, the Help page has a form that needs no account, and an email address on it is optional. A report describing a barrier is treated as a defect rather than as feedback. If it is easier, email ${SUPPORT.email} instead. Please say what you were trying to do, what happened, and which assistive technology, browser and device you were using — that is usually the difference between a problem that can be reproduced and one that cannot.`,
  },
  {
    heading: "Not legal advice",
    body: `This statement describes an independent study tool. It is not legal advice, not a conformance report, and not an accessibility audit, and it does not state anyone's obligations under the Americans with Disabilities Act, Section 508, the European Accessibility Act or any other law. ${COMPANY.name} is not affiliated with, endorsed by, or sponsored by the IAPP, and nothing here speaks for them.`,
  },
];
