"use client";

import { useEffect } from "react";
import type { PresentedOption, Question } from "@/content/types";
import { toggleSelection } from "@/lib/grading";

export function useStudyHotkeys({
  question,
  options,
  selected,
  revealed,
  finished,
  withScheduling,
  onSelect,
  onAdvance,
}: {
  question: Question | undefined;
  options: readonly PresentedOption[];
  selected: readonly string[];
  revealed: boolean;
  finished: boolean;
  withScheduling: boolean;
  /**
   * Called with the full selection after a letter key. The caller decides what
   * that means — since answers commit on choosing, this both selects and, when
   * the selection is complete, submits.
   */
  onSelect: (ids: string[]) => void;
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
      /*
        Enter advances and nothing else. It used to submit a pending answer;
        there is no such state any more, because a complete selection has
        already been graded by the time any other key could be pressed.
      */
      if (e.key === "Enter") {
        if (revealed && !withScheduling) onAdvance();
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
    onSelect, onAdvance,
  ]);
}
