"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { OptionKey, Question } from "@/content/types";
import { gradeAnswer } from "@/lib/grading";
import { newReviewCard, scheduleReview } from "@/lib/spaced-repetition";
import { getBrowserSupabase } from "@/lib/supabase/client";
import {
  loadProgress,
  pushAttempt,
  pushProfile,
  pushReviewCard,
} from "@/lib/supabase/sync";
import {
  emptyProgress,
  type Attempt,
  type Confidence,
  type ReviewGrade,
  type StudyMode,
  type UserProgress,
} from "@/lib/types";
import { daysBetween, todayISO } from "@/lib/utils";

const STORAGE_KEY = "nhid-clinical:progress:v1";

export interface AnswerResult {
  correct: boolean;
  correctAnswers: OptionKey[];
  /**
   * True when this answer put the question into the review queue for the first
   * time. Reported back so a session can tell the learner what it scheduled
   * instead of leaving the queue to be discovered.
   */
  queuedForReview: boolean;
}

interface ProgressContextValue {
  progress: UserProgress;
  /** False until local/remote hydration completes — gates first paint. */
  ready: boolean;
  user: User | null;
  authEnabled: boolean;
  syncing: boolean;
  recordAnswer: (
    question: Question,
    selected: OptionKey[],
    responseTimeMs: number,
    mode: StudyMode,
    confidence?: Confidence | null,
  ) => AnswerResult;
  gradeReview: (questionId: string, grade: ReviewGrade) => void;
  completeOnboarding: () => void;
  ackDisclaimer: () => void;
  setDailyGoal: (goal: number) => void;
  resetProgress: () => void;
  signOut: () => Promise<void>;
  /** Permanently deletes the account and all server-side progress. */
  deleteAccount: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(() => emptyProgress());
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);

  const supabase = useMemo(() => getBrowserSupabase(), []);
  const authEnabled = Boolean(supabase);

  // Refs so async writers always read current state without resubscribing.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  /* ---------------------------------------------------------------- */
  /* Hydration                                                         */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const local = readLocal();
      if (local && !cancelled) setProgress(local);

      if (!supabase) {
        if (!cancelled) setReady(true);
        return;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(currentUser ?? null);

      if (currentUser) {
        setSyncing(true);
        try {
          const remote = await loadProgress(supabase, currentUser.id);
          if (!cancelled) setProgress(remote);
        } catch {
          // Network or schema issue — keep working from local state.
        } finally {
          if (!cancelled) setSyncing(false);
        }
      }

      if (!cancelled) setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (event === "SIGNED_IN" && nextUser) {
        setSyncing(true);
        try {
          const remote = await loadProgress(supabase, nextUser.id);
          const local = progressRef.current;
          // A new account adopts whatever the signed-out session built up.
          if (remote.attempts.length === 0 && local.attempts.length > 0) {
            setProgress(local);
            await pushProfile(supabase, nextUser.id, local, nextUser.email);
          } else {
            setProgress(remote);
          }
        } finally {
          setSyncing(false);
        }
      }

      if (event === "SIGNED_OUT") {
        const fresh = emptyProgress();
        setProgress(fresh);
        writeLocal(fresh);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!ready) return;
    writeLocal(progress);
  }, [progress, ready]);

  /* ---------------------------------------------------------------- */
  /* Helpers                                                           */
  /* ---------------------------------------------------------------- */

  const persistProfile = useCallback(
    (next: UserProgress) => {
      const currentUser = userRef.current;
      if (supabase && currentUser) {
        void pushProfile(supabase, currentUser.id, next, currentUser.email).catch(
          () => {},
        );
      }
    },
    [supabase],
  );

  /* ---------------------------------------------------------------- */
  /* Mutations                                                         */
  /* ---------------------------------------------------------------- */

  const recordAnswer = useCallback<ProgressContextValue["recordAnswer"]>(
    (question, selected, responseTimeMs, mode, confidence = null) => {
      const now = new Date().toISOString();
      const today = todayISO();
      const prev = progressRef.current;
      const correct = gradeAnswer(question, selected);

      const attempt: Attempt = {
        id: `${question.id}-${Date.now()}`,
        trackId: question.trackId,
        questionId: question.id,
        selected,
        correct,
        responseTimeMs,
        difficulty: question.difficulty,
        domain: question.domain,
        confidence,
        createdAt: now,
        mode,
      };

      // A missed question enters the review queue immediately, so it survives
      // between sessions even if the learner never opens /review.
      const reviewCards = { ...prev.reviewCards };
      const queuedForReview = !correct && !reviewCards[question.id];
      if (queuedForReview) {
        reviewCards[question.id] = newReviewCard(
          question.id,
          question.trackId,
          today,
        );
      }

      const streak = nextStreak(prev, today);

      const next: UserProgress = {
        ...prev,
        attempts: [...prev.attempts, attempt],
        reviewCards,
        streak: streak.streak,
        longestStreak: streak.longestStreak,
        lastStudyDate: streak.lastStudyDate,
        updatedAt: now,
      };

      setProgress(next);

      const currentUser = userRef.current;
      if (supabase && currentUser) {
        void (async () => {
          try {
            await pushAttempt(supabase, currentUser.id, attempt);
            if (!correct && reviewCards[question.id]) {
              await pushReviewCard(supabase, currentUser.id, reviewCards[question.id]);
            }
            await pushProfile(supabase, currentUser.id, next, currentUser.email);
          } catch {
            // Local state remains authoritative; next load reconciles.
          }
        })();
      }

      return { correct, correctAnswers: question.correctAnswers, queuedForReview };
    },
    [supabase],
  );

  const gradeReview = useCallback<ProgressContextValue["gradeReview"]>(
    (questionId, grade) => {
      const prev = progressRef.current;
      const existing =
        prev.reviewCards[questionId] ?? newReviewCard(questionId, prev.trackId);
      const card = scheduleReview(existing, grade, todayISO());

      const next: UserProgress = {
        ...prev,
        reviewCards: { ...prev.reviewCards, [questionId]: card },
        updatedAt: new Date().toISOString(),
      };
      setProgress(next);

      const currentUser = userRef.current;
      if (supabase && currentUser) {
        void pushReviewCard(supabase, currentUser.id, card).catch(() => {});
      }
    },
    [supabase],
  );

  const completeOnboarding = useCallback(() => {
    setProgress((prev) => {
      if (prev.onboardingCompletedAt) return prev;
      const now = new Date().toISOString();
      const next = {
        ...prev,
        onboardingCompletedAt: now,
        disclaimerAckedAt: prev.disclaimerAckedAt ?? now,
        updatedAt: now,
      };
      persistProfile(next);
      return next;
    });
  }, [persistProfile]);

  const ackDisclaimer = useCallback(() => {
    setProgress((prev) => {
      const now = new Date().toISOString();
      const next = { ...prev, disclaimerAckedAt: now, updatedAt: now };
      persistProfile(next);
      return next;
    });
  }, [persistProfile]);

  const setDailyGoal = useCallback(
    (goal: number) => {
      setProgress((prev) => {
        const next = {
          ...prev,
          dailyGoal: Math.max(1, Math.min(100, Math.round(goal))),
          updatedAt: new Date().toISOString(),
        };
        persistProfile(next);
        return next;
      });
    },
    [persistProfile],
  );

  const resetProgress = useCallback(() => {
    const prev = progressRef.current;
    // Preserve the things that are settings rather than progress.
    const fresh: UserProgress = {
      ...emptyProgress(prev.trackId),
      dailyGoal: prev.dailyGoal,
      onboardingCompletedAt: prev.onboardingCompletedAt,
      disclaimerAckedAt: prev.disclaimerAckedAt,
    };
    setProgress(fresh);
    writeLocal(fresh);
    persistProfile(fresh);
  }, [persistProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  /**
   * Permanent account deletion, required by App Store guideline 5.1.1(v).
   *
   * Deleting an auth user needs the service role key, so the work happens in
   * the `delete-account` edge function; the client only invokes it with its own
   * session. On success the local session and cached progress are cleared too,
   * so nothing survives on the device.
   */
  const deleteAccount = useCallback(async () => {
    if (!supabase) throw new Error("Accounts are not configured.");
    const currentUser = userRef.current;
    if (!currentUser) throw new Error("You are not signed in.");

    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
    });
    if (error) throw new Error(error.message || "Could not delete account.");

    // Drop the local session and wipe cached progress. SIGNED_OUT would reset
    // state anyway, but clearing here means a failed sign-out cannot leave the
    // deleted account's data readable on the device.
    await supabase.auth.signOut();
    const fresh = emptyProgress();
    setProgress(fresh);
    writeLocal(fresh);
  }, [supabase]);

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      ready,
      user,
      authEnabled,
      syncing,
      recordAnswer,
      gradeReview,
      completeOnboarding,
      ackDisclaimer,
      setDailyGoal,
      resetProgress,
      signOut,
      deleteAccount,
    }),
    [
      progress,
      ready,
      user,
      authEnabled,
      syncing,
      recordAnswer,
      gradeReview,
      completeOnboarding,
      ackDisclaimer,
      setDailyGoal,
      resetProgress,
      signOut,
      deleteAccount,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within a ProgressProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Streak                                                              */
/* ------------------------------------------------------------------ */

function nextStreak(progress: UserProgress, today: string) {
  const { lastStudyDate } = progress;
  if (!lastStudyDate) {
    return {
      streak: 1,
      longestStreak: Math.max(1, progress.longestStreak),
      lastStudyDate: today,
    };
  }

  const gap = daysBetween(lastStudyDate, today);
  if (gap === 0) {
    return {
      streak: progress.streak,
      longestStreak: progress.longestStreak,
      lastStudyDate,
    };
  }

  const streak = gap === 1 ? progress.streak + 1 : 1;
  return {
    streak,
    longestStreak: Math.max(streak, progress.longestStreak),
    lastStudyDate: today,
  };
}

/** A streak lapses silently; report the true value rather than a stale one. */
export function effectiveStreak(progress: UserProgress, now = todayISO()) {
  if (!progress.lastStudyDate) return 0;
  return daysBetween(progress.lastStudyDate, now) <= 1 ? progress.streak : 0;
}

/* ------------------------------------------------------------------ */
/* localStorage                                                        */
/* ------------------------------------------------------------------ */

/**
 * The key the app used under its original name. Read once so a
 * beta tester who already has progress under the old key does not silently
 * lose it. Safe to delete once no pre-rename installs remain.
 */
const LEGACY_STORAGE_KEY = "judgment-labs:progress:v1";

function readLocal(): UserProgress | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacy) return null;
      // Migrate forward, then drop the old key so this runs exactly once.
      window.localStorage.setItem(STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      raw = legacy;
    }
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    // Spread over a fresh object so older stored shapes remain loadable.
    return migrateProgress({ ...emptyProgress(), ...parsed });
  } catch {
    return null;
  }
}

/**
 * Forward-migrate a stored progress object.
 *
 * `Attempt.selected` was a single OptionKey before multi-select landed and is
 * an array after it. Anyone with progress saved by an earlier build has the
 * old shape in localStorage, and every write path now calls `.join()` on it —
 * so without this, the first sync after upgrading would throw and the learner
 * would silently stop syncing. Cheap to run, and it costs nothing once the
 * stored data has been rewritten in the new shape.
 */
function migrateProgress(progress: UserProgress): UserProgress {
  let changed = false;
  const attempts = progress.attempts.map((attempt) => {
    if (Array.isArray(attempt.selected)) return attempt;
    changed = true;
    const legacy = attempt.selected as unknown as string;
    return {
      ...attempt,
      selected: String(legacy)
        .split(",")
        .map((k) => k.trim().toUpperCase())
        .filter(Boolean) as OptionKey[],
    };
  });
  return changed ? { ...progress, attempts } : progress;
}

function writeLocal(progress: UserProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Quota or private mode — the session still works, just without persistence.
  }
}
