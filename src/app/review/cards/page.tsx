"use client";

import Link from "next/link";
import { useState } from "react";
import { AppGate } from "@/components/app/app-gate";
import { Flashcards } from "@/components/study/flashcards";
import { buildDeck } from "@/lib/flashcards";
import { newSeed } from "@/lib/presentation";
import { useProgress } from "@/lib/store/progress-provider";

export default function FlashcardsPage() {
  return (
    <AppGate>
      <CardsSession />
    </AppGate>
  );
}

function CardsSession() {
  const { progress } = useProgress();

  /*
    Dealt once, in a state initialiser.

    Rating a card reschedules it, which takes it out of the review queue — so
    rebuilding the deck on each render would deal a different set of cards
    after every rating, and the learner would never reach the end of anything.
    The same reason `/review/session` resolves its sitting once.
  */
  const [deck] = useState(() => buildDeck(progress, { seed: newSeed() }));

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <p className="mb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-accent-strong">
            Flashcards
          </p>
          <h1 className="text-[1.75rem] leading-[1.15]">Recall it cold</h1>
        </div>
        <Link
          href="/review"
          className="text-[0.8125rem] text-muted-foreground underline decoration-border-strong underline-offset-2 hover:decoration-current"
        >
          Leave
        </Link>
      </header>

      <Flashcards deck={deck} exitHref="/review" />
    </div>
  );
}
