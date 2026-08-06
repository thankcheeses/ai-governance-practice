"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/app/disclaimer";
import type { LegalSection } from "@/content/legal";
import { COMPANY, LEGAL_EFFECTIVE_DATE } from "@/lib/brand";

interface LegalDocumentProps {
  title: string;
  summary: string;
  sections: LegalSection[];
  /**
   * Shown as a back link when the document is opened from inside the app.
   * Omitted on the public `/terms` and `/privacy` routes, which have no
   * Settings screen to return to and are reached directly from a store listing.
   */
  backHref?: string;
}

/**
 * Shared shell for the Terms and Privacy Policy.
 *
 * Both documents describe what the app actually does rather than generic
 * boilerplate, so every clause is checkable against the code. Each carries the
 * effective date and the company contact address, which both app stores expect
 * to find inside the app as well as on the listing.
 */
export function LegalDocument({
  title,
  summary,
  sections,
  backHref,
}: LegalDocumentProps) {
  return (
    <div className="measure space-y-6">
      <div>
        {backHref ? (
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Settings
            </Link>
          </Button>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {COMPANY.name} · Effective {LEGAL_EFFECTIVE_DATE}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-sm font-semibold">{section.heading}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}

          <section>
            <h2 className="text-sm font-semibold">Contact</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Questions about this document, your account, or your data go to{" "}
              <a
                href={`mailto:${COMPANY.email}`}
                className="break-all font-medium text-primary underline-offset-4 hover:underline"
              >
                {COMPANY.email}
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>

      <Disclaimer />
    </div>
  );
}
