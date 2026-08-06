/**
 * Terms and Privacy Policy content.
 *
 * Data only, so the same text can render at two places without drifting:
 *  - `/terms` and `/privacy` — public, no gate, for the store listings
 *  - `/settings/terms` and `/settings/privacy` — in-app, inside the shell
 *
 * Every clause describes what the app actually does and is checkable against
 * the code. Change behaviour and this text has to change with it.
 */
import { BRAND, COMPANY, LEGAL_EFFECTIVE_DATE } from "@/lib/brand";

export interface LegalSection {
  heading: string;
  body: string;
}

export { LEGAL_EFFECTIVE_DATE };

export const TERMS_SUMMARY = `These terms govern your use of ${BRAND.name}, published by ${COMPANY.name}. By creating an account or continuing to use the app, you agree to them.`;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "The service",
    body: `${BRAND.name} is published by ${COMPANY.name}, ${COMPANY.descriptor}. It is a scenario-based training product: you work through governance situations drawn from AI risk, privacy, security, and healthcare practice, and receive a rationale and a transferable takeaway on each. All scenarios, rationales, and takeaways are original material written for professional development.`,
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
    heading: "No certification affiliation or outcome guarantee",
    body: "This product is not affiliated with, endorsed by, sponsored by, or connected to the IAPP, CompTIA, the Cloud Security Alliance, or any certification body. It contains no actual certification exam questions and does not guarantee exam success or any other outcome.",
  },
  {
    heading: "Accounts",
    body: "An account is optional — the app works without one and keeps progress on your device. If you create one, you are responsible for the accuracy of the email you supply, for keeping your password confidential, and for activity under your account. You must be old enough to form a binding contract where you live. Tell us promptly at the address below if you believe your account has been accessed without your permission.",
  },
  {
    heading: "Acceptable use",
    body: "Do not scrape, bulk-export, resell, republish, or use the scenario content to train a machine learning model. Do not attempt to breach authentication, access another user's data, probe or disrupt the service, or submit unlawful content. Do not present this content as certification exam material or as the output of any certification body.",
  },
  {
    heading: "Price",
    body: "The service is free. There are no paid plans, no subscriptions, and no locked features — every scenario, the review queue, and the progress analytics are available to everyone. No payment processing exists, no charge is taken, and no payment details are collected. If that ever changes, the terms will change with it and the change will be presented for acceptance before any charge.",
  },
  {
    heading: "Beta status and changes",
    body: "This is a public beta. Features may change or be withdrawn, availability is not guaranteed, and progress data may need to be migrated as the product develops. We may update these terms; the effective date above will change and material updates will be surfaced in the app.",
  },
  {
    heading: "Termination",
    body: "You may stop using the service at any time and delete your account from Settings → Account, which permanently removes your account and associated progress. We may suspend or terminate access for breach of these terms, for unlawful use, or where required by law — in most cases with notice, and immediately where the conduct is serious or ongoing. Provisions on acceptable use, disclaimers, and liability survive termination.",
  },
  {
    heading: "Limitation of liability",
    body: `The service is provided "as is" and "as available", without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, accuracy, and non-infringement. To the maximum extent permitted by law, ${COMPANY.name} is not liable for indirect, incidental, special, consequential, or exemplary damages, nor for lost profits, lost data, or business interruption. Our total aggregate liability arising out of or relating to the service is limited to the greater of the amount you paid in the twelve months before the claim, or fifty US dollars. Nothing here excludes liability that cannot lawfully be excluded.`,
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
    body: "No account is required. Used signed out, the app collects no personal data at all: your answers, review schedule, streak, daily goal, and theme stay in your browser's local storage on your device and are never transmitted to us.",
  },
  {
    heading: "What we collect if you create an account",
    body: "Your email address, and your learning progress: which scenarios you answered, the option you chose, whether it was correct, how long you took, your self-reported confidence, your review schedule, and your streak. We do not ask for your name, employer, job title, or any health information, and you should not enter patient data, protected health information, or confidential material anywhere in the app.",
  },
  {
    heading: "What we never collect",
    body: "No analytics or telemetry SDK is present in the app. No advertising identifiers, no third-party trackers, no cross-site tracking, no device fingerprinting, no location data, and no payment details — there is no checkout. We do not sell or share personal data, and we do not use your data to train machine learning models.",
  },
  {
    heading: "Where your data is stored",
    body: "Account data is stored in Supabase, our hosted database and authentication provider, which processes it on our behalf under contract. Every progress row is protected by row-level security keyed to your user id, so one account cannot read another's data. Traffic is encrypted in transit over HTTPS. The app is served by Vercel, which processes standard request logs as our hosting provider.",
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
