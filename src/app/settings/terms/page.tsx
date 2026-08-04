"use client";

import { AppGate } from "@/components/app/app-gate";
import { LegalPlaceholder } from "@/components/app/legal-placeholder";

export default function TermsPage() {
  return (
    <AppGate>
      <LegalPlaceholder
        title="Terms of Use"
        summary="Full terms will be published before general availability. The points below reflect how this MVP is intended to be used."
        points={[
          {
            heading: "Educational use only",
            body: "Content is provided for professional development. It is not legal, compliance, or professional advice, and should not be relied on for real governance decisions. Consult primary sources and qualified counsel.",
          },
          {
            heading: "No certification guarantee",
            body: "This product does not contain actual certification exam questions and does not guarantee exam success or any particular outcome.",
          },
          {
            heading: "Content ownership",
            body: "All questions, scenarios, rationales, and takeaways are original material. Framework and standard names referenced are the property of their respective owners and appear only to describe subject matter.",
          },
          {
            heading: "Availability",
            body: "This is an early-access build. Features may change, and progress data may need to be migrated as the product develops.",
          },
        ]}
      />
    </AppGate>
  );
}
