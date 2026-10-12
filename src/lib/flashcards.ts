import { getTrackQuestions } from "@/content/registry";
import type { Question, TrackId } from "@/content/types";
import { buildReviewQueue } from "@/lib/spaced-repetition";
import type { ReviewCard, UserProgress } from "@/lib/types";
import { shuffle } from "@/lib/utils";

/**
 * Flashcards: the same bank, without the options.
 *
 * ## Why a separate mode at all
 *
 * Practice and review both show four options, so they test *recognition* — the
 * learner reads the stem, reads the options, and picks. That is the exam's
 * format and the right thing to rehearse. It is not the right thing to rehearse
 * exclusively: on the day, nobody hands you the answer alongside three wrong
 * ones until after you have already thought. A card with the options removed
 * asks a harder question, which is the point of it.
 *
 * ## Why these cards do not touch accuracy
 *
 * A flashcard is self-graded. "I knew that" is a claim about yourself, not a
 * measured answer, and the dashboard's accuracy — and the readiness band it
 * feeds — are built out of answers graded against a key. Writing self-grades
 * into `attempts` would put an unmeasured number into a measured series, where
 * nothing downstream could tell the two apart.
 *
 * So the deck moves the spaced-repetition schedule and nothing else. That is
 * the half a self-grade is genuinely good for: *when should I see this again*
 * is exactly the question the learner is best placed to answer.
 */
export const DECK_SIZE = 20;

/** Why a card is in the deck, which the screen says out loud. */
export type CardSource = "due" | "new" | "seen";

export interface Flashcard {
  question: Question;
  /** The scheduling card, where one exists — absent for a first sighting. */
  card: ReviewCard | null;
  source: CardSource;
}

/**
 * Builds a deck: everything due first, then questions never seen, then the
 * rest.
 *
 * The order is the review queue's order — missed, then low-confidence, then
 * scheduled — because that ordering is already the product's answer to "what
 * is worth your next five minutes", and a second, differently-ordered answer
 * would just be a disagreement. Unseen questions follow, so a learner whose
 * queue is empty still has a deck to work; the shuffle is seeded so the deck
 * survives a re-render and a resumed session deals the same cards.
 */
export function buildDeck(
  progress: UserProgress,
  {
    size = DECK_SIZE,
    seed,
    trackId,
  }: { size?: number; seed?: number; trackId?: TrackId } = {},
): Flashcard[] {
  const track = trackId ?? progress.trackId;
  const deck: Flashcard[] = buildReviewQueue(progress)
    .filter((item) => item.question.trackId === track)
    .slice(0, size)
    .map((item) => ({
      question: item.question,
      card: item.card,
      source: "due" as const,
    }));

  if (deck.length >= size) return deck;

  const taken = new Set(deck.map((c) => c.question.id));
  const attempted = new Set(progress.attempts.map((a) => a.questionId));
  const rest = getTrackQuestions(track).filter((q) => !taken.has(q.id));

  // Never seen before, then seen already — a question the learner has never
  // met teaches more than a second pass over one they have.
  const unseen = shuffle(
    rest.filter((q) => !attempted.has(q.id)),
    seed,
  );
  const seen = shuffle(
    rest.filter((q) => attempted.has(q.id)),
    seed,
  );

  for (const q of [...unseen, ...seen]) {
    if (deck.length >= size) break;
    deck.push({
      question: q,
      card: progress.reviewCards[q.id] ?? null,
      source: attempted.has(q.id) ? "seen" : "new",
    });
  }

  return deck;
}

/**
 * The back of the card: the answer, in the order the question records it.
 *
 * Not shuffled, and not lettered. A letter would be a lie here — there are no
 * options on screen to letter — and for a multi-select item the answer is the
 * set, so both entries are returned rather than one.
 */
export function answerText(question: Question): string[] {
  return question.correctOptionIds
    .map((id) => question.options.find((o) => o.id === id)?.text)
    .filter((text): text is string => Boolean(text));
}
