import type {
  Child, ChildData, ItemResult, LearningSession, LessonAttempt, LessonProgress,
  LessonResultInput, Reward, RewardType,
} from "../types";
import { getSupabase } from "../supabase/client";
import type { Store } from "./index";
import { mergeProgress } from "./util";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const toChild = (r: Row): Child => ({ id: r.id, nickname: r.nickname, avatar: r.avatar, createdAt: r.created_at });
const toProgress = (r: Row): LessonProgress => ({
  childId: r.child_id, lessonId: r.lesson_id, status: r.completion_status, bestStars: r.score,
  attempts: r.attempts, correct: r.correct_answers, incorrect: r.incorrect_answers,
  durationSeconds: r.duration_seconds, lastPlayedAt: r.last_played_at, completedAt: r.completed_at ?? undefined,
});
const toAttempt = (r: Row): LessonAttempt => ({
  id: r.id, childId: r.child_id, lessonId: r.lesson_id, stars: r.stars, correct: r.correct_answers,
  incorrect: r.incorrect_answers, durationSeconds: r.duration_seconds, createdAt: r.created_at,
});
const toItem = (r: Row): ItemResult => ({
  childId: r.child_id, lessonId: r.lesson_id, itemId: r.item_id, label: r.item_label,
  correctFirstTry: r.correct_first_try, attempts: r.attempts, createdAt: r.created_at,
});
const toReward = (r: Row): Reward => ({
  id: r.id, childId: r.child_id, type: r.reward_type, value: r.reward_value, amount: r.amount, earnedAt: r.earned_at,
});
const toSession = (r: Row): LearningSession => ({
  id: r.id, childId: r.child_id, startedAt: r.started_at, endedAt: r.ended_at ?? r.started_at, totalDuration: r.total_duration ?? 0,
});

/**
 * Cloud store. Every query runs as the signed-in PARENT; RLS guarantees a parent
 * can only read/write rows for their own children (see 0002_rls.sql).
 */
export class SupabaseStore implements Store {
  readonly mode = "cloud" as const;
  private get db() {
    return getSupabase();
  }

  async listChildren() {
    const rows = check(await this.db.from("children").select("*").order("created_at"));
    return (rows ?? []).map(toChild);
  }

  async createChild(nickname: string, avatar: string) {
    // parent_id defaults to auth.uid() in the database.
    const row = check(await this.db.from("children").insert({ nickname: nickname.trim().slice(0, 20), avatar }).select().single());
    return toChild(row);
  }

  async updateChild(id: string, patch: Partial<Pick<Child, "nickname" | "avatar">>) {
    check(await this.db.from("children").update(patch).eq("id", id));
  }

  async deleteChild(id: string) {
    check(await this.db.from("children").delete().eq("id", id)); // cascades to all child data
  }

  async getChildData(childId: string): Promise<ChildData> {
    const [p, a, i, r, s] = await Promise.all([
      this.db.from("child_progress").select("*").eq("child_id", childId),
      this.db.from("lesson_attempts").select("*").eq("child_id", childId).order("created_at", { ascending: false }).limit(200),
      this.db.from("item_results").select("*").eq("child_id", childId).order("created_at", { ascending: false }).limit(1000),
      this.db.from("rewards").select("*").eq("child_id", childId),
      this.db.from("learning_sessions").select("*").eq("child_id", childId).order("started_at", { ascending: false }).limit(200),
    ]);
    return {
      progress: (check(p) ?? []).map(toProgress),
      attempts: (check(a) ?? []).map(toAttempt),
      items: (check(i) ?? []).map(toItem),
      rewards: (check(r) ?? []).map(toReward),
      sessions: (check(s) ?? []).map(toSession),
    };
  }

  async recordLesson(r: LessonResultInput) {
    const now = new Date().toISOString();
    const prevRow = check(
      await this.db.from("child_progress").select("*").eq("child_id", r.childId).eq("lesson_id", r.lessonId).maybeSingle(),
    );
    const m = mergeProgress(prevRow ? toProgress(prevRow) : undefined, r, now);
    check(
      await this.db.from("child_progress").upsert(
        {
          child_id: m.childId, lesson_id: m.lessonId, completion_status: m.status, score: m.bestStars,
          attempts: m.attempts, correct_answers: m.correct, incorrect_answers: m.incorrect,
          duration_seconds: m.durationSeconds, last_played_at: m.lastPlayedAt, completed_at: m.completedAt,
        },
        { onConflict: "child_id,lesson_id" },
      ),
    );
    check(
      await this.db.from("lesson_attempts").insert({
        child_id: r.childId, lesson_id: r.lessonId, stars: r.stars, correct_answers: r.correct,
        incorrect_answers: r.incorrect, duration_seconds: r.durationSeconds,
      }),
    );
    if (r.items.length) {
      check(
        await this.db.from("item_results").insert(
          r.items.map((it) => ({
            child_id: r.childId, lesson_id: r.lessonId, item_id: it.itemId, item_label: it.label,
            correct_first_try: it.correctFirstTry, attempts: it.attempts,
          })),
        ),
      );
    }
  }

  async addReward(childId: string, type: RewardType, value: string, amount: number) {
    const row = check(
      await this.db.from("rewards").insert({ child_id: childId, reward_type: type, reward_value: value, amount }).select().single(),
    );
    return toReward(row);
  }

  async startSession(childId: string) {
    const row = check(await this.db.from("learning_sessions").insert({ child_id: childId }).select("id").single());
    return (row as { id: string }).id;
  }

  async touchSession(sessionId: string, totalDuration: number) {
    check(
      await this.db.from("learning_sessions")
        .update({ ended_at: new Date().toISOString(), total_duration: totalDuration })
        .eq("id", sessionId),
    );
  }
}
