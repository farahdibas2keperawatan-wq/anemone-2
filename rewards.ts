import type { LearningModule, Lesson } from "@/content/types";
import type { ChildData, Reward } from "./types";
import { getStore } from "./store";
import { progressMap, todayKey, totalStars } from "./progress";

/** Badge catalogue. Badges celebrate effort & milestones — never speed or ranking. */
export const BADGES: Record<string, { name: string; emoji: string; desc: string }> = {
  first_mission: { name: "Misi Pertama", emoji: "🐣", desc: "Menyelesaikan misi pertama" },
  sound_friend: { name: "Sahabat Suara", emoji: "🎵", desc: "Mengenal semua teman laut pertama" },
  first_word: { name: "Pembaca Kata", emoji: "📝", desc: "Membaca kata pertama" },
  stars_10: { name: "10 Bintang", emoji: "⭐", desc: "Mengumpulkan 10 bintang" },
  stars_30: { name: "Bintang Laut", emoji: "🌟", desc: "Mengumpulkan 30 bintang" },
  explorer: { name: "Penjelajah", emoji: "🧭", desc: "Membuka 3 pulau" },
  storyteller: { name: "Pembaca Cerita", emoji: "🏰", desc: "Sampai di Istana Cerita" },
  try_again: { name: "Pantang Menyerah", emoji: "💪", desc: "Mengulang misi untuk berlatih" },
};

export const CHEST_SHELLS = 5;
export const DAILY_SHELLS = 1;

export interface EarnedRewards {
  xp: number;
  badges: string[];
  chest: boolean;
}

/** Grant rewards after a lesson; returns what was newly earned (for the celebration screen). */
export async function grantLessonRewards(
  modules: LearningModule[],
  lesson: Lesson,
  stars: number,
  childId: string,
  before: ChildData,
  after: ChildData,
): Promise<EarnedRewards> {
  const store = getStore();
  const xp = 10 + stars * 5;
  await store.addReward(childId, "xp", lesson.id, xp);

  const has = new Set(after.rewards.filter((r) => r.type === "badge").map((r) => r.value));
  const doneAfter = progressMap(after);
  const isDone = (id: string) => doneAfter.get(id)?.status === "completed";
  const modDone = (mid: string) => modules.find((m) => m.id === mid)?.lessons.every((l) => isDone(l.id)) ?? false;
  const modulesStarted = modules.filter((m) => m.lessons.some((l) => isDone(l.id))).length;
  const replay = (before.progress.find((p) => p.lessonId === lesson.id)?.attempts ?? 0) >= 1;

  const want: [string, boolean][] = [
    ["first_mission", after.progress.length >= 1],
    ["sound_friend", modDone(modules[0]?.id ?? "")],
    ["first_word", lesson.mechanic === "syllable_build" || lesson.mechanic === "word_explore"],
    ["stars_10", totalStars(after) >= 10],
    ["stars_30", totalStars(after) >= 30],
    ["explorer", modulesStarted >= 3],
    ["storyteller", modules.at(-1)?.lessons.some((l) => isDone(l.id)) ?? false],
    ["try_again", replay],
  ];
  const badges: string[] = [];
  for (const [b, ok] of want) {
    if (ok && !has.has(b)) {
      await store.addReward(childId, "badge", b, 1);
      badges.push(b);
    }
  }

  // Treasure chest: first completion of an island's treasure quiz.
  let chest = false;
  const firstTime = !before.progress.some((p) => p.lessonId === lesson.id && p.status === "completed");
  if (lesson.mechanic === "treasure_quiz" && firstTime) {
    await store.addReward(childId, "chest", lesson.moduleId, CHEST_SHELLS);
    chest = true;
  }
  return { xp, badges, chest };
}

/** One small gift for the first visit of the day. No streaks, nothing lost for missing a day. */
export async function claimDailyIfAvailable(childId: string, data: ChildData): Promise<Reward | null> {
  const today = todayKey();
  if (data.rewards.some((r) => r.type === "daily" && r.value === today)) return null;
  return getStore().addReward(childId, "daily", today, DAILY_SHELLS);
}
