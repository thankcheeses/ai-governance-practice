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
  correctOptionIds: string[];
  queuedForReview: boolean;
}

interface ProgressContextValue {
  progress: UserProgress;
  ready: boolean;
  user: User | null;
  authEnabled: boolean;
  syncing: boolean;
  syncError: string | null;
  recordAnswer: (
    question: Question,
    selected: string[],
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
  deleteAccount: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(() => emptyProgress());
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const supabase = useMemo(() => getBrowserSupabase(), []);
  const authEnabled = Boolean(supabase);

  const progressRef = useRef(progress);
  progressRef.current = progress;
  const userRef = useRef<User | null>(null);
  userRef.current = user;

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
          if (!cancelled) {
            const current = progressRef.current;
            setProgress(
              remote.attempts.length >= current.attempts.length ? remote : current,
            );
            setSyncError(null);
          }
        } catch (err) {
          if (!cancelled) {
            setSyncError(
              err instanceof Error ? err.message : "Progress could not be synced.",
            );
          }
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
          const winner =
            remote.attempts.length > local.attempts.length ? remote : local;
          setProgress(winner);
          if (winner === local && local.attempts.length > 0) {
            await pushProfile(supabase, nextUser.id, local, nextUser.email);
          }
          setSyncError(null);
        } catch (err) {
          setSyncError(
            err instanceof Error ? err.message : "Progress could not be synced.",
          );
        } finally {
          setSyncing(false);
        }
      }

      if (event === "SIGNED_OUT") {
        // Keep local progress. Explicit wipe is resetProgress / deleteAccount only.
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!ready) return;
    writeLocal(progress);
  }, [progress, ready]);

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

      return { correct, correctOptionIds: question.correctOptionIds, queuedForReview };
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
          dailyGoal: Math.max(1, Math.round(goal) || 1),
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

  const deleteAccount = useCallback(async () => {
    if (!supabase) throw new Error("Accounts are not configured.");
    const currentUser = userRef.current;
    if (!currentUser) throw new Error("You are not signed in.");

    const { error } = await supabase.functions.invoke("delete-account", {
      method: "POST",
    });
    if (error) throw new Error(error.message || "Could not delete account.");

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
      syncError,
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
      syncError,
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

export function effectiveStreak(progress: UserProgress, now = todayISO()) {
  if (!progress.lastStudyDate) return 0;
  return daysBetween(progress.lastStudyDate, now) <= 1 ? progress.streak : 0;
}

const LEGACY_STORAGE_KEY = "judgment-labs:progress:v1";

function readLocal(): UserProgress | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacy) return null;
      window.localStorage.setItem(STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      raw = legacy;
    }
    const parsed = JSON.parse(raw) as Partial<UserProgress>;
    return migrateProgress({ ...emptyProgress(), ...parsed });
  } catch {
    return null;
  }
}

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
