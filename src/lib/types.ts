export interface Child {
  id: string;
  nickname: string;
  avatar: string; // emoji key from AVATARS
  createdAt: string;
}

export interface LessonProgress {
  childId: string;
  lessonId: string;
  status: "in_progress" | "completed";
  bestStars: number;        // 1–3 (completion always earns ≥1)
  attempts: number;         // times the lesson was played
  correct: number;          // cumulative first-try correct answers
  incorrect: number;        // cumulative wrong taps
  durationSeconds: number;  // cumulative
  lastPlayedAt: string;
  completedAt?: string;
}

export interface LessonAttempt {
  id: string;
  childId: string;
  lessonId: string;
  stars: number;
  correct: number;
  incorrect: number;
  durationSeconds: number;
  createdAt: string;
}

export interface ItemResult {
  childId: string;
  lessonId: string;
  itemId: string;
  label: string;          // human-readable, e.g. "ba" or "bola"
  correctFirstTry: boolean;
  attempts: number;
  createdAt: string;
}

export type RewardType = "xp" | "badge" | "chest" | "daily";
export interface Reward {
  id: string;
  childId: string;
  type: RewardType;
  value: string;   // badge id / chest id / date
  amount: number;  // xp amount, shells, etc.
  earnedAt: string;
}

export interface LearningSession {
  id: string;
  childId: string;
  startedAt: string;
  endedAt: string;
  totalDuration: number; // seconds
}

/** Everything the app knows about one child. */
export interface ChildData {
  progress: LessonProgress[];
  attempts: LessonAttempt[];
  items: ItemResult[];
  rewards: Reward[];
  sessions: LearningSession[];
}

export interface LessonResultInput {
  childId: string;
  lessonId: string;
  stars: number;
  correct: number;
  incorrect: number;
  durationSeconds: number;
  items: Omit<ItemResult, "childId" | "lessonId" | "createdAt">[];
}
