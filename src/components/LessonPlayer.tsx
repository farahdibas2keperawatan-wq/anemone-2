"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Play, X } from "lucide-react";
import type { LearningItem, LearningModule, Lesson } from "@/content/types";
import { audio, ENCOURAGE, pick, PRAISE } from "@/lib/audio";
import { getStore } from "@/lib/store";
import { isScored, itemLabel, starsFor } from "@/lib/progress";
import { grantLessonRewards, type EarnedRewards } from "@/lib/rewards";
import { useApp } from "./providers";
import { Mascot } from "./Mascot";
import { AudioToggles, Button, IconButton } from "./ui";
import { Celebration } from "./Celebration";
import type { Feedback, ItemOutcome } from "./games/shared";
import { SoundStory } from "./games/SoundStory";
import { ListenChoose } from "./games/ListenChoose";
import { MatchPairs } from "./games/MatchPairs";
import { SyllableBuilder } from "./games/SyllableBuilder";
import { WordExplorer } from "./games/WordExplorer";
import { ReadDiscover } from "./games/ReadDiscover";

function ItemView({ item, onDone, feedback }: { item: LearningItem; onDone: (o: ItemOutcome) => void; feedback: Feedback }) {
  switch (item.kind) {
    case "sound_story": return <SoundStory item={item} onDone={onDone} feedback={feedback} />;
    case "listen_choose": return <ListenChoose item={item} onDone={onDone} feedback={feedback} />;
    case "match": return <MatchPairs item={item} onDone={onDone} feedback={feedback} />;
    case "syllable_build": return <SyllableBuilder item={item} onDone={onDone} feedback={feedback} />;
    case "word_explore": return <WordExplorer item={item} onDone={onDone} feedback={feedback} />;
    case "read_discover": return <ReadDiscover item={item} onDone={onDone} feedback={feedback} />;
  }
}

export interface FinishSummary {
  stars: number;
  earned: EarnedRewards | null;
  saveError?: string;
}

export function LessonPlayer({ lesson, module, nextLessonId }: { lesson: Lesson; module: LearningModule; nextLessonId?: string }) {
  const router = useRouter();
  const { activeChild, childData, refreshChildData, modules } = useApp();
  const [phase, setPhase] = useState<"intro" | "play" | "saving" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [bubble, setBubble] = useState<{ text: string; mood: "happy" | "cheer" | "think" } | null>(null);
  const [summary, setSummary] = useState<FinishSummary | null>(null);
  const outcomes = useRef<{ item: LearningItem; o: ItemOutcome }[]>([]);
  const startedAt = useRef(0);
  const [runId, setRunId] = useState(0);

  // Spoken instructions on the intro screen.
  useEffect(() => {
    if (phase !== "intro") return;
    setBubble({ text: lesson.instructions, mood: "happy" });
    const t = setTimeout(() => audio.say(lesson.instructions, { url: lesson.audioUrl }), 400);
    return () => { clearTimeout(t); audio.stopSpeech(); };
  }, [phase, lesson]);

  const feedback: Feedback = useCallback(async (kind, text) => {
    const msg = text ?? (kind === "correct" ? pick(PRAISE) : kind === "retry" ? pick(ENCOURAGE) : "");
    setBubble({ text: msg, mood: kind === "correct" ? "cheer" : kind === "retry" ? "think" : "happy" });
    await audio.say(msg);
  }, []);

  const start = () => {
    audio.unlock();
    outcomes.current = [];
    startedAt.current = Date.now();
    setIndex(0);
    setBubble(null);
    setPhase("play");
  };

  const onItemDone = useCallback(async (o: ItemOutcome) => {
    const item = lesson.items[index];
    outcomes.current.push({ item, o });
    if (index + 1 < lesson.items.length) {
      setBubble(null);
      setIndex((i) => i + 1);
      return;
    }
    // ---- lesson finished ----
    setPhase("saving");
    const scored = outcomes.current.filter((x) => isScored(x.item));
    const firstTry = scored.filter((x) => x.o.correctFirstTry).length;
    const stars = starsFor(firstTry, scored.length);
    const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    let earned: EarnedRewards | null = null;
    let saveError: string | undefined;
    if (activeChild && childData) {
      try {
        const before = childData;
        await getStore().recordLesson({
          childId: activeChild.id, lessonId: lesson.id, stars,
          correct: firstTry,
          incorrect: outcomes.current.reduce((s, x) => s + x.o.wrongTaps, 0),
          durationSeconds,
          items: scored.map((x) => ({
            itemId: x.item.id, label: itemLabel(x.item), correctFirstTry: x.o.correctFirstTry, attempts: x.o.attempts,
          })),
        });
        const after = (await refreshChildData()) ?? before;
        earned = await grantLessonRewards(modules, lesson, stars, activeChild.id, before, after);
        await refreshChildData();
      } catch (e) {
        saveError = (e as Error).message;
      }
    }
    setSummary({ stars, earned, saveError });
    setPhase("done");
  }, [index, lesson, activeChild, childData, refreshChildData, modules]);

  const item = lesson.items[index];

  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-1 flex-col">
      {/* top: close + progress bubbles */}
      <header className="mb-4 flex items-center gap-3">
        <IconButton label="Keluar" onClick={() => { audio.stopSpeech(); router.push(`/pulau/${module.id}`); }}>
          <X size={28} strokeWidth={3} />
        </IconButton>
        <div className="flex flex-1 items-center justify-center gap-2" aria-label={`Langkah ${index + 1} dari ${lesson.items.length}`}>
          {lesson.items.map((_, i) => (
            <span key={i} className={`h-4 rounded-full transition-all ${
              phase === "done" || i < index ? "w-8 bg-lagoon" : i === index && phase === "play" ? "w-10 bg-sun" : "w-4 bg-white/80"
            }`} />
          ))}
        </div>
        <AudioToggles />
      </header>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.section key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <p className="text-lg font-bold text-ink-soft">{module.emoji} {module.title}</p>
            <h1 className="text-4xl font-extrabold">{lesson.title}</h1>
            <div className="mt-16"><Mascot size={170} say={bubble?.text} /></div>
            <Button tone="lagoon" size="xl" onClick={start} aria-label="Mulai">
              <Play size={40} fill="currentColor" /> Mulai
            </Button>
          </motion.section>
        )}

        {phase === "play" && item && (
          <motion.section key={`${runId}-${item.id}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex flex-1 flex-col">
            <ItemView item={item} onDone={onItemDone} feedback={feedback} />
            <div className="pointer-events-none sticky bottom-2 mt-6 flex justify-start pl-2">
              <div className="pt-20"><Mascot size={84} bubbleAlign="left" mood={bubble?.mood ?? "happy"} say={bubble?.text || undefined} /></div>
            </div>
          </motion.section>
        )}

        {phase === "saving" && (
          <motion.section key="saving" className="flex flex-1 items-center justify-center">
            <Mascot size={150} mood="cheer" say="Menyimpan bintangmu…" />
          </motion.section>
        )}

        {phase === "done" && summary && (
          <motion.section key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-1 flex-col">
            <Celebration
              summary={summary}
              lesson={lesson}
              onReplay={() => { setRunId((r) => r + 1); setSummary(null); start(); }}
              onNext={nextLessonId ? () => router.push(`/misi/${nextLessonId}`) : undefined}
              onMap={() => router.push(lesson.mechanic === "treasure_quiz" ? "/peta" : `/pulau/${module.id}`)}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
