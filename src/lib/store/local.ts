import type { Child, ChildData, LessonResultInput, Reward, RewardType } from "../types";
import type { Store } from "./index";
import { mergeProgress, uid } from "./util";

const KEY = "anemone:v1";

interface DB extends ChildData {
  children: Child[];
}

const empty = (): DB => ({ children: [], progress: [], attempts: [], items: [], rewards: [], sessions: [] });

function load(): DB {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}

function save(db: DB) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked (private mode) — app keeps working in memory */
  }
}

/** Demo-mode store: everything in localStorage on this device. */
export class LocalStore implements Store {
  readonly mode = "demo" as const;

  async listChildren() {
    return load().children;
  }

  async createChild(nickname: string, avatar: string) {
    const db = load();
    const child: Child = { id: uid(), nickname: nickname.trim().slice(0, 20), avatar, createdAt: new Date().toISOString() };
    db.children.push(child);
    save(db);
    return child;
  }

  async updateChild(id: string, patch: Partial<Pick<Child, "nickname" | "avatar">>) {
    const db = load();
    db.children = db.children.map((c) => (c.id === id ? { ...c, ...patch } : c));
    save(db);
  }

  async deleteChild(id: string) {
    const db = load();
    const keep = <T extends { childId: string }>(rows: T[]) => rows.filter((r) => r.childId !== id);
    save({
      children: db.children.filter((c) => c.id !== id),
      progress: keep(db.progress), attempts: keep(db.attempts), items: keep(db.items),
      rewards: keep(db.rewards), sessions: keep(db.sessions),
    });
  }

  async getChildData(childId: string): Promise<ChildData> {
    const db = load();
    const mine = <T extends { childId: string }>(rows: T[]) => rows.filter((r) => r.childId === childId);
    return {
      progress: mine(db.progress), attempts: mine(db.attempts), items: mine(db.items),
      rewards: mine(db.rewards), sessions: mine(db.sessions),
    };
  }

  async recordLesson(r: LessonResultInput) {
    const db = load();
    const now = new Date().toISOString();
    const i = db.progress.findIndex((p) => p.childId === r.childId && p.lessonId === r.lessonId);
    const merged = mergeProgress(i >= 0 ? db.progress[i] : undefined, r, now);
    if (i >= 0) db.progress[i] = merged;
    else db.progress.push(merged);
    db.attempts.push({
      id: uid(), childId: r.childId, lessonId: r.lessonId, stars: r.stars,
      correct: r.correct, incorrect: r.incorrect, durationSeconds: r.durationSeconds, createdAt: now,
    });
    db.items.push(...r.items.map((it) => ({ ...it, childId: r.childId, lessonId: r.lessonId, createdAt: now })));
    save(db);
  }

  async addReward(childId: string, type: RewardType, value: string, amount: number) {
    const db = load();
    const reward: Reward = { id: uid(), childId, type, value, amount, earnedAt: new Date().toISOString() };
    db.rewards.push(reward);
    save(db);
    return reward;
  }

  async startSession(childId: string) {
    const db = load();
    const now = new Date().toISOString();
    const id = uid();
    db.sessions.push({ id, childId, startedAt: now, endedAt: now, totalDuration: 0 });
    save(db);
    return id;
  }

  async touchSession(sessionId: string, totalDuration: number) {
    const db = load();
    const s = db.sessions.find((x) => x.id === sessionId);
    if (s) {
      s.endedAt = new Date().toISOString();
      s.totalDuration = totalDuration;
      save(db);
    }
  }
}
