"use client";

import { AppGate } from "@/components/app/app-gate";
import { LegalDocument } from "@/components/app/legal-document";
import { BRAND, COMPANY } from "@/lib/brand";

export default function PrivacyPage() {
  return (
    <AppGate>
      <LegalDocument
        title="Privacy Policy"
        summary={`How ${COMPANY.name} handles your data in ${BRAND.name}. Every statement below describes what the app does today, not what it may do later.`}
        sections={[
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
            body: "Your email address, and your learning progress: which scenarios you answered, the option you chose, whether it was correct, how long you took, your self-reported confidence, your review schedule, your streak, and your plan tier. We do not ask for your name, employer, job title, or any health information, and you should not enter patient data, protected health information, or confidential material anywhere in the app.",
          },
          {
            heading: "What we never collect",
            body: "No analytics or telemetry SDK is present in the app. No advertising identifiers, no third-party trackers, no cross-site tracking, no device fingerprinting, no location data, and no payment details — there is no checkout in this beta. We do not sell or share personal data, and we do not use your data to train machine learning models.",
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
        ]}
      />
    </AppGate>
  );
}
