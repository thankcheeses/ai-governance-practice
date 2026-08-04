"use client";

import { AppGate } from "@/components/app/app-gate";
import { LegalPlaceholder } from "@/components/app/legal-placeholder";

export default function PrivacyPage() {
  return (
    <AppGate>
      <LegalPlaceholder
        title="Privacy Policy"
        summary="A full privacy policy will be published before general availability. This page describes how the MVP handles data today."
        points={[
          {
            heading: "What is stored",
            body: "Your answers, review schedule, daily goal, and theme preference. No question content you write, because there is none to write.",
          },
          {
            heading: "Where it is stored",
            body: "Without an account, everything stays in your browser's local storage and never leaves your device. With an account, the same data is stored in Supabase against your user id and protected by row level security so only you can read it.",
          },
          {
            heading: "What is not collected",
            body: "No analytics, no advertising identifiers, no third-party trackers, and no payment information — there is no checkout in this build.",
          },
          {
            heading: "Deleting your data",
            body: "Settings → Data → Reset progress clears your answers and review schedule. Signing out clears the local copy.",
          },
        ]}
      />
    </AppGate>
  );
}
