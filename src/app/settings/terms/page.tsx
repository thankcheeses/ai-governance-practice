"use client";

import { AppGate } from "@/components/app/app-gate";
import { LegalDocument } from "@/components/app/legal-document";
import { TERMS_SECTIONS, TERMS_SUMMARY } from "@/content/legal";

export default function TermsPage() {
  return (
    <AppGate>
      <LegalDocument
        title="Terms of Service"
        summary={TERMS_SUMMARY}
        sections={TERMS_SECTIONS}
        backHref="/settings"
      />
    </AppGate>
  );
}
