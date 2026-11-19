# Pedagogical assumptions to review with the Anemone team

The brief asked for the app to follow the official *Cara Baca Ajaib* sequence and to flag any assumptions. No Anemone teaching materials were provided, so the curriculum is built **only** on what Anemone says publicly:

- Children learn to read **without spelling** ("tanpa mengeja") and **without memorising the alphabet** ("tanpa hafal huruf").
- Sounds are introduced through **stories, fairy tales and characters**.
- Children move quickly to reading **whole words, sentences and stories**.
- The method is aimed at children aged 4–6 who can't read yet.

The brief's generic structure ("recognising letters and their sounds", "Match the Letter") conflicts with the method's "no letter memorisation" principle. **The method takes priority.** For that reason, the app **never shows or speaks single letters**. The smallest unit is a whole sound/syllable such as *ma*, introduced by a character.

## What must be confirmed or replaced

| # | Assumption | Where it lives |
|---|---|---|
| A1 | The first sound units are **ma, pa, ba, ta, ka, la**, in that order | `curriculum.ts` → module `m1` |
| A2 | The characters and stories (Mama Paus, Kakek Penyu, …) are **original placeholders**, not Anemone's own characters | `SOUND_FRIENDS` in `curriculum.ts` |
| A3 | Two-sound words (mama, papa, mata, bata) come straight after the first 6 sounds | module `m2` |
| A4 | Sounds with the vowels i/u/o (ki, ku, bu, pi, bo, to, tu, lu) come after the "a" family | module `m3` |
| A5 | *ini* / *itu* are taught as whole "magic words" before simple sentences | module `m4` |
| A6 | The first story is a 4-sentence placeholder using only words already learned | module `m5` |
| A7 | Unlocking is strictly linear (each lesson unlocks the next) | `lib/progress.ts → unlockedLessonIds` |
| A8 | Stars are based on first-try accuracy (3★ ≥ 85%, 2★ ≥ 50%, otherwise 1★). Completing a lesson always earns at least 1★. | `lib/progress.ts → starsFor` |
| A9 | A sound or word is flagged as "needs practice" when first-try accuracy is below 70% | `lib/progress.ts → computeStats` |
| A10 | A break is suggested after 10 minutes of play | `BREAK_AFTER_SECONDS` in `components/providers.tsx` |
| A11 | Pronunciation uses browser text-to-speech until professional recordings are added | `lib/audio.ts`, `content/audio-manifest.ts` |

## How to apply the official sequence
1. Replace the modules, lessons and items in `src/content/curriculum.ts`. The helper functions (`story`, `listen`, `build`, `explore`, `read`, …) keep each entry to one line.
2. Keep the rule that each lesson uses only sound units taught in earlier lessons.
3. Run `npm run seed:sql` and apply `supabase/seed.sql`, or edit the rows directly in Supabase.
4. Record the audio and register it in `audio-manifest.ts` or `audio_url`.

The parent dashboard shows every module's assumption note, so reviewers can see it in context.
