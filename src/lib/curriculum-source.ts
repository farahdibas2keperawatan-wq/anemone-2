import { CURRICULUM } from "@/content/curriculum";
import type { LearningItem, LearningModule, Lesson } from "@/content/types";
import { getSupabase, isSupabaseConfigured } from "./supabase/client";

/**
 * Loads the curriculum. When Supabase is configured the database is the source of truth
 * (so educators can edit content without redeploying); otherwise — or if the tables are
 * empty/unreachable — the bundled config in src/content/curriculum.ts is used.
 */
export async function loadCurriculum(): Promise<{ modules: LearningModule[]; source: "database" | "bundled" }> {
  if (!isSupabaseConfigured()) return { modules: CURRICULUM, source: "bundled" };
  try {
    const db = getSupabase();
    const [m, l, i] = await Promise.all([
      db.from("learning_modules").select("*").eq("is_active", true).order("sequence_order"),
      db.from("lessons").select("*").eq("is_active", true).order("sequence_order"),
      db.from("learning_items").select("*").order("sequence_order"),
    ]);
    if (m.error || l.error || i.error || !m.data?.length) throw m.error ?? l.error ?? i.error ?? new Error("empty");

    const itemsByLesson = new Map<string, LearningItem[]>();
    for (const row of i.data) {
      const item = { ...(row.payload as LearningItem), id: row.id, audioUrl: row.audio_url ?? undefined, imageUrl: row.image_url ?? undefined };
      itemsByLesson.set(row.lesson_id, [...(itemsByLesson.get(row.lesson_id) ?? []), item]);
    }
    const lessonsByModule = new Map<string, Lesson[]>();
    for (const row of l.data) {
      const lesson: Lesson = {
        id: row.id, moduleId: row.module_id, title: row.title, instructions: row.instructions,
        mechanic: row.content_type, order: row.sequence_order, audioUrl: row.audio_url ?? undefined,
        items: itemsByLesson.get(row.id) ?? [],
      };
      lessonsByModule.set(row.module_id, [...(lessonsByModule.get(row.module_id) ?? []), lesson]);
    }
    const modules: LearningModule[] = m.data.map((row) => ({
      id: row.id, title: row.title, subtitle: row.subtitle ?? "", description: row.description ?? "",
      emoji: row.emoji ?? "🏝️", color: row.color ?? "sea", order: row.sequence_order,
      difficulty: row.difficulty_level ?? 1, isActive: row.is_active, assumption: row.assumption_note ?? undefined,
      lessons: lessonsByModule.get(row.id) ?? [],
    }));
    return { modules, source: "database" };
  } catch (e) {
    console.warn("[curriculum] falling back to bundled content:", e);
    return { modules: CURRICULUM, source: "bundled" };
  }
}
