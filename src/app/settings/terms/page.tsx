"use client";

import { AppGate } from "@/components/app/app-gate";
import { LegalDocument } from "@/components/app/legal-document";
import { COMPANY } from "@/lib/brand";

export default function TermsPage() {
  return (
    <AppGate>
      <LegalDocument
        title="Terms of Service"
        summary={`These terms govern your use of the ${COMPANY.name} app. By creating an account or continuing to use it, you agree to them.`}
        sections={[
          {
            heading: "The service",
            body: `${COMPANY.name} is ${COMPANY.descriptor}. This app is its scenario-based training product: you work through governance situations drawn from AI risk, privacy, security, and healthcare practice, and receive a rationale and a transferable takeaway on each. All scenarios, rationales, and takeaways are original material written for professional development.`,
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
            body: "Do not scrape, bulk-export, resell, republish, or use the scenario content to train a machine learning model. Do not share, resell, or circumvent access to paid tiers. Do not attempt to breach authentication, access another user's data, probe or disrupt the service, or submit unlawful content. Do not present this content as certification exam material or as the output of any certification body.",
          },
          {
            heading: "Plans and billing",
            body: "The Free plan is available at no cost. Paid plans are described in the app. No payment processing is active in this beta, so no charge is taken and no payment details are collected. When billing begins, prices, renewal terms, and refund rights will be presented for acceptance before any charge, and purchases made through an app store are additionally governed by that store's terms.",
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
        ]}
      />
    </AppGate>
  );
}
