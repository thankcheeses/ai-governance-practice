"use client";

import { AppGate } from "@/components/app/app-gate";
import { LegalDocument } from "@/components/app/legal-document";
import { ACCESSIBILITY_SECTIONS, ACCESSIBILITY_SUMMARY } from "@/content/legal";

export default function AccessibilityPage() {
  return (
    <AppGate>
      <LegalDocument
        title="Accessibility"
        summary={ACCESSIBILITY_SUMMARY}
        sections={ACCESSIBILITY_SECTIONS}
        backHref="/settings"
      />
    </AppGate>
  );
}
