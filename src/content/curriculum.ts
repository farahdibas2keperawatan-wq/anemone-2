/**
 * ============================================================================
 *  CURRICULUM CONFIG — the single source of truth for the learning sequence.
 * ============================================================================
 *
 *  ⚠️  REVIEW REQUIRED BY THE ANEMONE TEAM
 *  No official "Cara Baca Ajaib" teaching materials were supplied with the brief.
 *  The sequence below follows only what Anemone states publicly:
 *    • children read WITHOUT spelling ("tanpa mengeja") and WITHOUT memorising
 *      the alphabet ("tanpa hafal huruf");
 *    • sounds are introduced through stories and characters;
 *    • children then read whole words, sentences and stories.
 *
 *  Everything else — which sound units come first, the characters, stories,
 *  words and sentences — is a PLACEHOLDER. Every module carries an `assumption`
 *  note that is also shown in the Parent Dashboard and docs/ASSUMPTIONS.md.
 *
 *  To change the content: edit this file, then run `npm run seed:sql` to
 *  regenerate supabase/seed.sql (or edit rows directly in Supabase — the app
 *  reads from the database when it is configured).
 *
 *  Design rules enforced here (keep them when editing):
 *    1. Only use sound units that were introduced in an EARLIER lesson.
 *    2. Never split a word into single letters.
 *    3. Each lesson ≤ 6 items (≈ 2–3 minutes) so a session stays 5–10 minutes.
 */
import type { LearningModule, Lesson, LearningItem } from "./types";

// --- tiny helpers to keep the config readable -------------------------------
let n = 0;
const id = (lessonId: string) => `${lessonId}-i${++n}`;

function lesson(
  moduleId: string,
  order: number,
  title: string,
  mechanic: Lesson["mechanic"],
  instructions: string,
  build: (lid: string) => LearningItem[],
): Lesson {
  const lid = `${moduleId}-l${order}`;
  n = 0;
  return { id: lid, moduleId, order, title, mechanic, instructions, items: build(lid) };
}

// Picture dictionary — swap emoji for illustrated image URLs later (item.imageUrl).
export const PICTURES: Record<string, string> = {
  mama: "👩", papa: "👨", mata: "👁️", bata: "🧱",
  kaki: "🦶", buku: "📖", bola: "⚽", topi: "🧢", batu: "🪨", palu: "🔨",
};

// Sound characters (PLACEHOLDERS — replace with official Anemone characters/stories).
export const SOUND_FRIENDS = {
  ma: { character: "Mama Paus", emoji: "🐳", story: "Mama Paus memanggil anaknya. Maaa… maaa…" },
  pa: { character: "Kakek Penyu", emoji: "🐢", story: "Kakek Penyu berjalan pelan. Pa… pa… pa…" },
  ba: { character: "Ikan Buntal", emoji: "🐡", story: "Ikan Buntal menggembung, lalu… ba!" },
  ta: { character: "Kepiting Merah", emoji: "🦀", story: "Kepiting mengetuk batu. Ta… ta… ta…" },
  ka: { character: "Gurita Kecil", emoji: "🐙", story: "Gurita Kecil tertawa geli. Ka… ka… ka…" },
  la: { character: "Lumba-lumba", emoji: "🐬", story: "Lumba-lumba bernyanyi riang. La… la… la…" },
  ki: { character: "Bintang Laut", emoji: "⭐", story: "Bintang Laut berkedip-kedip. Ki… ki… ki…" },
  ku: { character: "Cumi-cumi", emoji: "🦑", story: "Cumi-cumi berenang mundur. Ku… ku… ku…" },
  bu: { character: "Ikan Badut", emoji: "🐠", story: "Ikan Badut meniup gelembung. Bu… bu… bu…" },
  pi: { character: "Pinguin", emoji: "🐧", story: "Pinguin kedinginan. Pi… pi… pi…" },
  bo: { character: "Anjing Laut", emoji: "🦭", story: "Anjing Laut memantulkan bola. Bo… bo… bo…" },
  to: { character: "Kapal Kecil", emoji: "⛵", story: "Kapal Kecil membunyikan terompet. Tooo… to!" },
  tu: { character: "Siput", emoji: "🐌", story: "Siput bersiul pelan. Tu… tu… tu…" },
  lu: { character: "Udang", emoji: "🦐", story: "Udang melompat-lompat. Lu… lu… lu…" },
} as const;
type Sound = keyof typeof SOUND_FRIENDS;

const story = (lid: string, s: Sound): LearningItem => ({
  id: id(lid), kind: "sound_story", sound: s, ...SOUND_FRIENDS[s],
});
const listen = (lid: string, answer: string, options: string[], withPictures = false): LearningItem => ({
  id: id(lid), kind: "listen_choose", say: answer, answer, options,
  emojis: withPictures ? Object.fromEntries(options.map((o) => [o, PICTURES[o] ?? SOUND_FRIENDS[o as Sound]?.emoji ?? ""])) : undefined,
});
const matchSounds = (lid: string, sounds: Sound[]): LearningItem => ({
  id: id(lid), kind: "match", pairs: sounds.map((s) => ({ text: s, emoji: SOUND_FRIENDS[s].emoji })),
});
const matchWords = (lid: string, words: string[]): LearningItem => ({
  id: id(lid), kind: "match", pairs: words.map((w) => ({ text: w, emoji: PICTURES[w] })),
});
const build = (lid: string, word: string, parts: string[], extra: string[]): LearningItem => ({
  id: id(lid), kind: "syllable_build", word, parts, extra, emoji: PICTURES[word],
});
const explore = (lid: string, word: string, others: string[]): LearningItem => ({
  id: id(lid), kind: "word_explore", word, emoji: PICTURES[word],
  options: [word, ...others].map((w) => ({ word: w, emoji: PICTURES[w] })),
});
const read = (lid: string, sentence: string, emoji: string): LearningItem => ({
  id: id(lid), kind: "read_discover", sentence, emoji,
});

// --- the sequence -----------------------------------------------------------
export const CURRICULUM: LearningModule[] = [
  {
    id: "m1", order: 1, difficulty: 1, isActive: true, color: "coral", emoji: "🐚",
    title: "Pulau Suara Ajaib",
    subtitle: "Kenalan dengan teman-teman laut",
    description: "Anak mengenal 6 bunyi suku kata (ma, pa, ba, ta, ka, la) lewat tokoh dan cerita — tanpa menghafal huruf.",
    assumption: "Urutan bunyi pertama (ma, pa, ba, ta, ka, la) dan tokoh-tokohnya adalah placeholder. Ganti dengan urutan & tokoh resmi Cara Baca Ajaib.",
    lessons: [
      lesson("m1", 1, "Teman Laut Pertama", "sound_story", "Ayo kenalan dengan teman laut! Dengarkan suaranya, lalu tirukan ya.",
        (l) => [story(l, "ma"), story(l, "pa"), story(l, "ba")]),
      lesson("m1", 2, "Teman Laut Baru", "sound_story", "Ada teman baru! Dengarkan dan tirukan suaranya.",
        (l) => [story(l, "ta"), story(l, "ka"), story(l, "la")]),
      lesson("m1", 3, "Dengar & Pilih", "listen_choose", "Dengarkan suaranya, lalu ketuk yang sama.",
        (l) => [listen(l, "ma", ["ma", "pa"]), listen(l, "ba", ["ta", "ba"]), listen(l, "ka", ["ka", "la", "ma"]),
                listen(l, "la", ["pa", "la", "ba"]), listen(l, "ta", ["ta", "ka", "la"])]),
      lesson("m1", 4, "Pasangkan Teman", "match", "Ketuk suara, lalu ketuk teman lautnya.",
        (l) => [matchSounds(l, ["ma", "pa", "ba"]), matchSounds(l, ["ta", "ka", "la"])]),
      lesson("m1", 5, "Peti Harta Pulau Suara", "treasure_quiz", "Waktunya mencari harta karun! Jawab semuanya ya.",
        (l) => [listen(l, "pa", ["pa", "ba"]), listen(l, "la", ["ka", "la"]), matchSounds(l, ["ma", "ka", "ta"]),
                listen(l, "ba", ["ma", "ta", "ba"])]),
    ],
  },
  {
    id: "m2", order: 2, difficulty: 2, isActive: true, color: "sun", emoji: "🏝️",
    title: "Pulau Kata Pertama",
    subtitle: "Suara bergandengan jadi kata",
    description: "Dua bunyi yang sudah dikenal digabung menjadi kata utuh bermakna (mama, papa, mata, bata).",
    assumption: "Diasumsikan anak membaca kata dua-suku setelah 6 bunyi pertama. Konfirmasi titik masuk ke kata utuh pada metode resmi.",
    lessons: [
      lesson("m2", 1, "Susun Kata", "syllable_build", "Lihat gambarnya. Ketuk suara yang pas untuk membuat katanya.",
        (l) => [build(l, "mama", ["ma", "ma"], ["pa"]), build(l, "papa", ["pa", "pa"], ["ba"]),
                build(l, "mata", ["ma", "ta"], ["ka"]), build(l, "bata", ["ba", "ta"], ["la"])]),
      lesson("m2", 2, "Jelajah Kata", "word_explore", "Ketuk katanya untuk mendengar. Lalu pilih gambarnya.",
        (l) => [explore(l, "mama", ["papa"]), explore(l, "mata", ["bata"]), explore(l, "papa", ["mata", "mama"]),
                explore(l, "bata", ["mama", "mata"])]),
      lesson("m2", 3, "Dengar Kata", "listen_choose", "Dengarkan katanya, lalu ketuk tulisan yang sama.",
        (l) => [listen(l, "mama", ["mama", "papa"], true), listen(l, "mata", ["bata", "mata"], true),
                listen(l, "bata", ["mata", "bata", "papa"], true)]),
      lesson("m2", 4, "Peti Harta Pulau Kata", "treasure_quiz", "Ayo buka peti harta karun!",
        (l) => [matchWords(l, ["mama", "papa", "mata"]), build(l, "bata", ["ba", "ta"], ["ma"]),
                explore(l, "papa", ["bata"]), listen(l, "mata", ["mama", "mata"])]),
    ],
  },
  {
    id: "m3", order: 3, difficulty: 3, isActive: true, color: "lagoon", emoji: "🪸",
    title: "Pulau Suara Baru",
    subtitle: "Bunyi baru, kata baru",
    description: "Bunyi dengan vokal i, u, o (ki, ku, bu, pi, bo, to, tu, lu) lalu kata baru: kaki, buku, bola, topi, batu, palu.",
    assumption: "Pengenalan vokal i/u/o sesudah keluarga 'a' adalah asumsi umum. Sesuaikan dengan urutan bunyi pada modul Anemone.",
    lessons: [
      lesson("m3", 1, "Teman Karang", "sound_story", "Teman-teman dari karang mau berkenalan!",
        (l) => [story(l, "ki"), story(l, "ku"), story(l, "bu"), story(l, "pi")]),
      lesson("m3", 2, "Teman Ombak", "sound_story", "Dengarkan suara teman-teman dari ombak.",
        (l) => [story(l, "bo"), story(l, "to"), story(l, "tu"), story(l, "lu")]),
      lesson("m3", 3, "Dengar & Pilih", "listen_choose", "Dengarkan, lalu ketuk yang sama.",
        (l) => [listen(l, "ki", ["ka", "ki"]), listen(l, "bu", ["bu", "ba"]), listen(l, "to", ["tu", "to", "ta"]),
                listen(l, "lu", ["la", "lu", "ku"])]),
      lesson("m3", 4, "Susun Kata Baru", "syllable_build", "Ketuk suara yang pas untuk membuat katanya.",
        (l) => [build(l, "kaki", ["ka", "ki"], ["ku"]), build(l, "buku", ["bu", "ku"], ["ba"]),
                build(l, "bola", ["bo", "la"], ["lu"]), build(l, "topi", ["to", "pi"], ["tu"])]),
      lesson("m3", 5, "Jelajah Kata", "word_explore", "Ketuk katanya, lalu pilih gambarnya.",
        (l) => [explore(l, "batu", ["buku"]), explore(l, "palu", ["bola", "kaki"]), explore(l, "topi", ["batu", "palu"])]),
      lesson("m3", 6, "Peti Harta Pulau Karang", "treasure_quiz", "Ayo cari harta karun di karang!",
        (l) => [matchWords(l, ["kaki", "buku", "bola"]), build(l, "palu", ["pa", "lu"], ["la"]),
                listen(l, "topi", ["topi", "batu"], true), explore(l, "buku", ["kaki", "bola"])]),
    ],
  },
  {
    id: "m4", order: 4, difficulty: 4, isActive: true, color: "sea", emoji: "🐠",
    title: "Pulau Kalimat",
    subtitle: "Kata bergandengan jadi kalimat",
    description: "Kata ajaib 'ini' dan 'itu' dikenalkan sebagai kata utuh, lalu dipakai dalam kalimat dua–tiga kata.",
    assumption: "Kata 'ini/itu' diperlakukan sebagai kata utuh (whole word). Pastikan kata pengantar kalimat sama dengan materi resmi.",
    lessons: [
      lesson("m4", 1, "Kata Ajaib", "word_explore", "Ini kata ajaib! Ketuk untuk mendengar, lalu pilih gambarnya.",
        (l) => [
          { id: id(l), kind: "word_explore", word: "ini", emoji: "👇", options: [{ word: "ini", emoji: "👇" }, { word: "itu", emoji: "👉" }] },
          { id: id(l), kind: "word_explore", word: "itu", emoji: "👉", options: [{ word: "ini", emoji: "👇" }, { word: "itu", emoji: "👉" }] },
        ]),
      lesson("m4", 2, "Baca Kalimat", "read_discover", "Dengarkan dulu, lalu ketuk setiap kata untuk membaca.",
        (l) => [read(l, "ini bola", "⚽"), read(l, "itu topi", "🧢"), read(l, "ini buku papa", "📖"), read(l, "itu kaki mama", "🦶")]),
      lesson("m4", 3, "Peti Harta Pulau Kalimat", "treasure_quiz", "Peti harta karun menunggu!",
        (l) => [read(l, "itu batu", "🪨"), listen(l, "itu", ["ini", "itu"]), read(l, "ini palu papa", "🔨")]),
    ],
  },
  {
    id: "m5", order: 5, difficulty: 5, isActive: true, color: "lilac", emoji: "🏰",
    title: "Istana Cerita",
    subtitle: "Membaca cerita pertama",
    description: "Cerita pendek 4 kalimat yang hanya memakai kata yang sudah dipelajari.",
    assumption: "Cerita placeholder. Ganti dengan cerita/dongeng resmi Anemone bila tersedia.",
    lessons: [
      lesson("m5", 1, "Cerita Papa dan Mama", "read_discover", "Ayo baca cerita! Dengarkan dulu, lalu baca bersama Anemone.",
        (l) => [read(l, "ini papa", "👨"), read(l, "papa topi", "🧢"), read(l, "itu mama", "👩"), read(l, "mama buku", "📖")]),
      lesson("m5", 2, "Harta Karun Terakhir", "treasure_quiz", "Ini harta karun paling besar! Kamu hebat sudah sampai sini!",
        (l) => [read(l, "ini bola papa", "⚽"), explore(l, "kaki", ["mata", "buku"]), build(l, "topi", ["to", "pi"], ["ta"]),
                listen(l, "buku", ["buku", "bola", "batu"], true)]),
    ],
  },
];

/** Flattened lessons in learning order — used for unlocking. */
export function allLessons(curriculum: LearningModule[]): Lesson[] {
  return [...curriculum]
    .filter((m) => m.isActive)
    .sort((a, b) => a.order - b.order)
    .flatMap((m) => [...m.lessons].sort((a, b) => a.order - b.order));
}
