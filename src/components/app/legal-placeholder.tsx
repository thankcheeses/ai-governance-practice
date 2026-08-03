"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Disclaimer } from "@/components/app/disclaimer";

interface LegalPlaceholderProps {
  title: string;
  summary: string;
  points: { heading: string; body: string }[];
}

/**
 * Shared shell for the Privacy and Terms placeholders. These describe the MVP's
 * actual behaviour rather than filler text, so they are useful now and easy to
 * replace with reviewed copy later.
 */
export function LegalPlaceholder({
  title,
  summary,
  points,
}: LegalPlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <Badge variant="outline">Placeholder</Badge>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-5">
          {points.map((point) => (
            <section key={point.heading}>
              <h2 className="text-sm font-semibold">{point.heading}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </section>
          ))}
        </CardContent>
      </Card>

      <Disclaimer />
    </div>
  );
}
