import type { Metadata } from "next";
import { LegalDocument } from "@/components/app/legal-document";
import { PRIVACY_SECTIONS, PRIVACY_SUMMARY } from "@/content/legal";
import { COMPANY } from "@/lib/brand";

/**
 * Public Privacy Policy.
 *
 * Deliberately outside `AppGate`: both stores require a privacy URL that a
 * reviewer can open cold, with no account and no onboarding in the way. A
 * server component so the title and description are real metadata rather than
 * something a client render has to produce.
 */
export const metadata: Metadata = {
  // The root layout appends "· {COMPANY.name}" via its title template.
  title: "Privacy Policy",
  description: `How ${COMPANY.name} collects, stores, and deletes personal data.`,
};

export default function PublicPrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-16">
      <LegalDocument
        title="Privacy Policy"
        summary={PRIVACY_SUMMARY}
        sections={PRIVACY_SECTIONS}
      />
    </main>
  );
}
