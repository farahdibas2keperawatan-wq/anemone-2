# 🌊 Anemone Magic Reading
**Petualangan Seru Belajar Membaca!** A web-based reading game for 4-year-olds, built around the *Cara Baca Ajaib Anemone* approach: reading **without spelling** and **without memorising letters**.

> ⚠️ **The curriculum content is a placeholder.** No official Anemone materials came with the brief. Read [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) before launch.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Framer Motion · Lucide React · Supabase (Postgres, Auth, RLS, Storage) · Vercel.

## Quick start
```bash
npm install
npm run dev            # http://localhost:3000
```
If no env vars are set, the app runs in **demo mode**: no account is needed and progress is saved in the browser (localStorage). This is useful for user testing with parents and teachers.

## Connect Supabase
1. Create a Supabase project.
2. In the SQL Editor, run these files in order:
   - `supabase/migrations/0001_schema.sql`: the tables
   - `supabase/migrations/0002_rls.sql`: Row Level Security policies
   - `supabase/seed.sql`: the curriculum content
3. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Under Authentication → URL Configuration, add your site URL (for example `https://your-app.vercel.app`) so the email confirmation link works.

With these set, parents sign up with email and password. Each parent owns their children's profiles, and **RLS guarantees one family can never read or write another family's data**. The app uses the anon key only. **The service-role key is never used in the frontend.**

Check the RLS policies locally (runs against an embedded Postgres with no setup needed):
```bash
npm run test:rls
```

## Deploy to Vercel
Import the repo in Vercel. Add the two `NEXT_PUBLIC_SUPABASE_*` variables, or leave them out to deploy in demo mode, then deploy. No other configuration is needed.

## Editing content
- **Source of truth (code):** `src/content/curriculum.ts`. After editing it, run `npm run seed:sql` to regenerate `supabase/seed.sql`.
- **Source of truth (database):** when Supabase is configured, the app reads `learning_modules`, `lessons` and `learning_items` from the database. Educators can edit rows in the Supabase table editor without redeploying. If the database can't be read, the app falls back to the bundled file.
- **Images:** emoji are used for now. Set `learning_items.image_url` (or `imageUrl` in the config) to use illustrations instead.

## Audio
`src/lib/audio.ts` is the single audio manager. For each spoken line it uses the first of these that is available:
1. `audio_url` on the item or lesson (for example a Supabase Storage URL)
2. `src/content/audio-manifest.ts`, which maps text to a file such as `"ma": "/audio/ma.mp3"`
3. The browser's Indonesian (id-ID) text-to-speech

TTS quality varies by device: Android and iOS usually include an Indonesian voice, but some desktop browsers don't. **Professional recordings are strongly recommended** for the sound units. Sound effects and soft background music are synthesised with WebAudio and can be muted. Music volume drops automatically while the voice is speaking, and no instruction depends on the music.

## App map
| Route | Screen |
|---|---|
| `/` | Welcome |
| `/anak` | Choose a child. Adding a profile requires the parent gate. |
| `/peta` | Adventure map: islands, next mission, daily gift |
| `/pulau/[id]` | An island's missions (later missions unlock in order) |
| `/misi/[id]` | Lesson player: intro → items → celebration |
| `/hadiah` | Stars, shells, XP, treasure chests, badges |
| `/orang-tua` | Parent dashboard (behind the parent gate) |
| `/masuk` | Parent sign-in and sign-up (Supabase mode only) |

## Game mechanics (`src/components/games`)
| Brief | Component | What the child does |
|---|---|---|
| Magical Sound Adventure | `SoundStory` | Meets a character who "owns" a sound, taps it, and imitates it |
| Listen and Choose | `ListenChoose` | Hears a sound or word, then taps the matching card |
| Match the Letter | `MatchPairs` | Pairs each sound or word with its character or picture (sound units, not letters) |
| Syllable Builder | `SyllableBuilder` | Hears a word and builds it from whole sound units |
| Word Explorer | `WordExplorer` | Reads a word (can tap to hear it), then picks the matching picture |
| Read and Discover | `ReadDiscover` | Listens with word-by-word highlighting, then reads by tapping each word |
| Treasure Quiz | any mix of the above | Island review that unlocks a treasure chest |

## Child-friendly design rules built into the app
- There is no failure state. A wrong tap makes the card wiggle softly and Anemone encourages the child to try again. After 2 misses, the right answer glows.
- Finishing a lesson always earns at least 1 star.
- Lessons are 2–5 items long. After 10 minutes of play, Anemone gently suggests a break, and the "next mission" button is hidden.
- The daily gift is 1 shell. There are no streaks, and nothing is lost for missing a day.
- Instructions are spoken aloud. Tap targets are at least 56px. Reduced-motion settings are respected.
- Children never type anything. Profiles hold only a nickname and an avatar, and only parents can create them.

## Project structure
```
src/
  app/            routes (all client components; data via the Store interface)
  components/     UI kit, mascot, parent gate, lesson player, games/
  content/        curriculum.ts (EDIT ME), types.ts, audio-manifest.ts
  lib/            audio.ts, progress.ts (unlocking & analytics), rewards.ts,
                  store/ (local + supabase implementations), supabase/client.ts
supabase/         migrations/, seed.sql
scripts/          generate-seed.mts, test-rls.mjs
docs/             ASSUMPTIONS.md, DESIGN_SYSTEM.md
```
