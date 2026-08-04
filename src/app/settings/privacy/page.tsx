"use client";

import { AppGate } from "@/components/app/app-gate";
import { LegalDocument } from "@/components/app/legal-document";
import { PRIVACY_SECTIONS, PRIVACY_SUMMARY } from "@/content/legal";

export default function PrivacyPage() {
  return (
    <AppGate>
      <LegalDocument
        title="Privacy Policy"
        summary={PRIVACY_SUMMARY}
        sections={PRIVACY_SECTIONS}
        backHref="/settings"
      />
    </AppGate>
  );
}
