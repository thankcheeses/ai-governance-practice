import type { Metadata } from "next";
import { LegalDocument } from "@/components/app/legal-document";
import { TERMS_SECTIONS, TERMS_SUMMARY } from "@/content/legal";
import { COMPANY } from "@/lib/brand";

/**
 * Public Terms of Service.
 *
 * Deliberately outside `AppGate`: both stores require a terms URL that a
 * reviewer can open cold, with no account and no onboarding in the way. A
 * server component so the title and description are real metadata rather than
 * something a client render has to produce.
 */
export const metadata: Metadata = {
  // The root layout appends "· {COMPANY.name}" via its title template.
  title: "Terms of Service",
  description: `Terms governing use of the ${COMPANY.name} AI governance training app.`,
};

export default function PublicTermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 pb-16">
      <LegalDocument
        title="Terms of Service"
        summary={TERMS_SUMMARY}
        sections={TERMS_SECTIONS}
      />
    </main>
  );
}
