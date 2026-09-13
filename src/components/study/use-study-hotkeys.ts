"use client";

import { useEffect } from "react";
import type { PresentedOption, Question } from "@/content/types";
import { canSubmit, toggleSelection } from "@/lib/grading";

export function useStudyHotkeys({
  question,
  options,
  selected,
  revealed,
  finished,
  withScheduling,
  onSelect,
  onSubmit,
  onAdvance,
}: {
  question: Question | undefined;
  options: readonly PresentedOption[];
  selected: readonly string[];
  revealed: boolean;
  finished: boolean;
  withScheduling: boolean;
  onSelect: (ids: string[]) => void;
  onSubmit: () => void;
  onAdvance: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (finished || !question) return;
      const letter = e.key.toLowerCase();
      if (!revealed && ["a", "b", "c", "d", "1", "2", "3", "4"].includes(letter)) {
        const map: Record<string, number> = {
          a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3,
        };
        const option = options[map[letter]];
        if (option) {
          e.preventDefault();
          onSelect(toggleSelection(question, [...selected], option.id));
        }
        return;
      }
      if (e.key === "Enter") {
        if (!revealed && canSubmit(question, selected)) onSubmit();
        else if (revealed && !withScheduling) onAdvance();
        return;
      }
      if ((letter === "n" || e.key === "ArrowRight") && revealed && !withScheduling) {
        e.preventDefault();
        onAdvance();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    question, options, selected, revealed, finished, withScheduling,
    onSelect, onSubmit, onAdvance,
  ]);
}
