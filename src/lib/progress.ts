import { allLessons } from "@/content/curriculum";
import type { LearningItem, LearningModule, Lesson } from "@/content/types";
import type { ChildData, LessonProgress } from "./types";

export function progressMap(data: ChildData | null): Map<string, LessonProgress> {
  return new Map((data?.progress ?? []).map((p) => [p.lessonId, p]));
}

/** A lesson unlocks when the lesson before it (in global order) is completed. */
export function unlockedLessonIds(modules: LearningModule[], data: ChildData | null): Set<string> {
  const done = progressMap(data);
  const out = new Set<string>();
  const seq = allLessons(modules);
  for (let i = 0; i < seq.length; i++) {
    if (i === 0 || done.get(seq[i - 1].id)?.status === "completed") out.add(seq[i].id);
    else break;
  }
  return out;
}

export function nextLesson(modules: LearningModule[], data: ChildData | null): Lesson | undefined {
  const done = progressMap(data);
  return allLessons(modules).find((l) => done.get(l.id)?.status !== "completed");
}

export function moduleOf(modules: LearningModule[], lessonId: string) {
  return modules.find((m) => m.lessons.some((l) => l.id === lessonId));
}

export function findLesson(modules: LearningModule[], lessonId: string) {
  for (const m of modules) {
    const l = m.lessons.find((x) => x.id === lessonId);
    if (l) return { module: m, lesson: l };
  }
  return undefined;
}

export function totalStars(data: ChildData | null) {
  return (data?.progress ?? []).reduce((s, p) => s + p.bestStars, 0);
}
export function totalXp(data: ChildData | null) {
  return (data?.rewards ?? []).filter((r) => r.type === "xp").reduce((s, r) => s + r.amount, 0);
}
export function totalShells(data: ChildData | null) {
  return (data?.rewards ?? []).filter((r) => r.type === "daily" || r.type === "chest").reduce((s, r) => s + r.amount, 0);
}

/** Stars are generous: finishing always earns ≥1 star. No failure state exists. */
export function starsFor(correctFirstTry: number, total: number) {
  if (total === 0) return 3;
  const acc = correctFirstTry / total;
  return acc >= 0.85 ? 3 : acc >= 0.5 ? 2 : 1;
}

/** Short label for an item, used in parent reports ("areas that need repetition"). */
export function itemLabel(item: LearningItem): string {
  switch (item.kind) {
    case "sound_story": return item.sound;
    case "listen_choose": return item.answer;
    case "match": return item.pairs.map((p) => p.text).join(" · ");
    case "syllable_build": return item.word;
    case "word_explore": return item.word;
    case "read_discover": return item.sentence;
  }
}

/** Is this item scored (has a right/wrong answer)? Exposure items are not. */
export function isScored(item: LearningItem) {
  return item.kind !== "sound_story" && item.kind !== "read_discover";
}

// ---------------- Parent analytics ----------------

export interface ChildStats {
  completedLessons: number;
  totalLessons: number;
  accuracy: number | null;      // % first-try correct across scored items
  totalSeconds: number;
  sessionsCount: number;
  lastActivity?: string;
  currentModule?: LearningModule;
  needsPractice: { label: string; accuracy: number; tries: number }[];
}

export function computeStats(modules: LearningModule[], data: ChildData | null): ChildStats {
  const seq = allLessons(modules);
  const done = progressMap(data);
  const scored = (data?.items ?? []).filter((i) => i.label);
  const firstTry = scored.filter((i) => i.correctFirstTry).length;

  // Aggregate by label → accuracy; flag weak spots (seen ≥1×, < 70% first-try).
  const byLabel = new Map<string, { ok: number; n: number }>();
  for (const it of scored) {
    const v = byLabel.get(it.label) ?? { ok: 0, n: 0 };
    v.n++; if (it.correctFirstTry) v.ok++;
    byLabel.set(it.label, v);
  }
  const needsPractice = [...byLabel.entries()]
    .map(([label, v]) => ({ label, accuracy: Math.round((v.ok / v.n) * 100), tries: v.n }))
    .filter((x) => x.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 8);

  const sessionSecs = (data?.sessions ?? []).reduce((s, x) => s + (x.totalDuration || 0), 0);
  const lessonSecs = (data?.progress ?? []).reduce((s, x) => s + x.durationSeconds, 0);
  const times = [
    ...(data?.attempts ?? []).map((a) => a.createdAt),
    ...(data?.sessions ?? []).map((s) => s.endedAt),
  ].sort();
  const next = nextLesson(modules, data);

  return {
    completedLessons: seq.filter((l) => done.get(l.id)?.status === "completed").length,
    totalLessons: seq.length,
    accuracy: scored.length ? Math.round((firstTry / scored.length) * 100) : null,
    totalSeconds: Math.max(sessionSecs, lessonSecs),
    sessionsCount: data?.sessions.length ?? 0,
    lastActivity: times.at(-1),
    currentModule: next ? moduleOf(modules, next.id) : modules.at(-1),
    needsPractice,
  };
}

export function formatDuration(secs: number) {
  const m = Math.floor(secs / 60);
  if (m < 1) return `${secs} detik`;
  const h = Math.floor(m / 60);
  return h ? `${h} jam ${m % 60} menit` : `${m} menit`;
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
