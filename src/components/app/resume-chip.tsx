"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readActiveSession,
  validateActiveSession,
  type ActiveSession,
} from "@/lib/active-session";

function hrefFor(session: ActiveSession) {
  if (session.mode === "review") return "/review/session";
  return "/study/session";
}

export function ResumeChip() {
  const [session, setSession] = useState<ActiveSession | null>(null);

  useEffect(() => {
    setSession(validateActiveSession(readActiveSession()));
  }, []);

  if (!session) return null;

  return (
    <Link
      href={hrefFor(session)}
      className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-[0.8125rem] font-medium no-underline shadow-[var(--shadow-raised)] hover:border-border-strong"
    >
      Continue question {session.index + 1} of {session.questionIds.length}
      <span className="ml-2 text-muted-foreground">{session.label}</span>
    </Link>
  );
}
