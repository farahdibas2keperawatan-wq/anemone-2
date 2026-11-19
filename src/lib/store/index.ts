import type { Child, ChildData, LessonResultInput, Reward, RewardType } from "../types";
import { isSupabaseConfigured } from "../supabase/client";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
export { uid, mergeProgress } from "./util";

/**
 * Persistence boundary. Screens never talk to localStorage or Supabase directly.
 * - LocalStore: demo mode, data stays on this device.
 * - SupabaseStore: parent account + Postgres with Row Level Security.
 */
export interface Store {
  readonly mode: "demo" | "cloud";
  listChildren(): Promise<Child[]>;
  createChild(nickname: string, avatar: string): Promise<Child>;
  updateChild(id: string, patch: Partial<Pick<Child, "nickname" | "avatar">>): Promise<void>;
  deleteChild(id: string): Promise<void>;
  getChildData(childId: string): Promise<ChildData>;
  recordLesson(input: LessonResultInput): Promise<void>;
  addReward(childId: string, type: RewardType, value: string, amount: number): Promise<Reward>;
  startSession(childId: string): Promise<string>;
  touchSession(sessionId: string, totalDuration: number): Promise<void>;
}

let store: Store | null = null;
export function getStore(): Store {
  if (!store) store = isSupabaseConfigured() ? new SupabaseStore() : new LocalStore();
  return store;
}

