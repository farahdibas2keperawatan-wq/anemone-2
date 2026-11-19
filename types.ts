/**
 * Content model for the learning curriculum.
 * The same shape is stored in Supabase (learning_modules / lessons / learning_items),
 * where mechanic-specific fields live in learning_items.payload (jsonb).
 */

export type Mechanic =
  | "sound_story"     // Petualangan Suara Ajaib — meet a character + its sound
  | "listen_choose"   // Dengar & Pilih
  | "match"           // Pasangkan
  | "syllable_build"  // Susun Suku Kata
  | "word_explore"    // Jelajah Kata
  | "read_discover"   // Baca & Temukan
  | "treasure_quiz";  // Kuis Harta Karun (mixed review)

interface ItemBase {
  id: string;
  /** Optional recorded audio, e.g. a Supabase Storage URL. Overrides text-to-speech. */
  audioUrl?: string;
  imageUrl?: string;
}

/** A character "owns" a sound unit. The child hears a tiny story, then the sound. */
export interface SoundStoryItem extends ItemBase {
  kind: "sound_story";
  character: string;  // e.g. "Mama Paus"
  emoji: string;
  sound: string;      // the unit shown & spoken, e.g. "ma"
  story: string;      // 1–2 short sentences, spoken aloud
}

/** Hear something, tap the matching card. */
export interface ListenChooseItem extends ItemBase {
  kind: "listen_choose";
  say: string;               // what is spoken
  answer: string;            // must be one of options
  options: string[];         // shown as large text cards
  emojis?: Record<string, string>; // optional picture hint per option
}

/** Pair each text with its picture/character. */
export interface MatchItem extends ItemBase {
  kind: "match";
  pairs: { text: string; emoji: string }[];
}

/** Build a word from sound units (never single letters — Anemone avoids spelling). */
export interface SyllableBuildItem extends ItemBase {
  kind: "syllable_build";
  word: string;
  parts: string[];   // in order
  extra: string[];   // distractor tiles
  emoji: string;
}

/** See a written word (tap to hear it), pick the right picture. */
export interface WordExploreItem extends ItemBase {
  kind: "word_explore";
  word: string;
  emoji: string;
  options: { word: string; emoji: string }[]; // includes the correct one
}

/** Listen to a short sentence with word highlighting, then "read" it by tapping each word. */
export interface ReadDiscoverItem extends ItemBase {
  kind: "read_discover";
  sentence: string;
  emoji: string;
}

export type LearningItem =
  | SoundStoryItem
  | ListenChooseItem
  | MatchItem
  | SyllableBuildItem
  | WordExploreItem
  | ReadDiscoverItem;

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  /** Spoken to the child at the start (simple Indonesian). */
  instructions: string;
  mechanic: Mechanic;
  order: number;
  audioUrl?: string;
  items: LearningItem[];
}

export interface LearningModule {
  id: string;
  title: string;        // island name
  subtitle: string;
  description: string;  // for parents
  emoji: string;
  color: "sea" | "lagoon" | "coral" | "sun" | "lilac";
  order: number;
  difficulty: number;
  isActive: boolean;
  /** Pedagogical assumption that must be reviewed against the official Anemone material. */
  assumption?: string;
  lessons: Lesson[];
}
