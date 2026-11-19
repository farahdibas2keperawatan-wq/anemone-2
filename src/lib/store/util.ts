import type { LessonProgress, LessonResultInput } from "../types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** Merge one lesson result into a cumulative progress row (shared by both stores). */
export function mergeProgress(
  prev: LessonProgress | undefined,
  r: LessonResultInput,
  now: string,
): LessonProgress {
  return {
    childId: r.childId,
    lessonId: r.lessonId,
    status: "completed",
    bestStars: Math.max(prev?.bestStars ?? 0, r.stars),
    attempts: (prev?.attempts ?? 0) + 1,
    correct: (prev?.correct ?? 0) + r.correct,
    incorrect: (prev?.incorrect ?? 0) + r.incorrect,
    durationSeconds: (prev?.durationSeconds ?? 0) + r.durationSeconds,
    lastPlayedAt: now,
    completedAt: prev?.completedAt ?? now,
  };
}
