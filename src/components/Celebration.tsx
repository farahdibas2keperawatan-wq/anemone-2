"use client";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Map, RotateCcw } from "lucide-react";
import type { Lesson } from "@/content/types";
import { audio } from "@/lib/audio";
import { BADGES, CHEST_SHELLS } from "@/lib/rewards";
import { Mascot } from "./Mascot";
import { Button } from "./ui";
import { BREAK_AFTER_SECONDS, useApp } from "./providers";
import type { FinishSummary } from "./LessonPlayer";

export function Celebration({ summary, lesson, onReplay, onNext, onMap }: {
  summary: FinishSummary; lesson: Lesson; onReplay: () => void; onNext?: () => void; onMap: () => void;
}) {
  const { sessionSeconds } = useApp();
  const needsBreak = sessionSeconds >= BREAK_AFTER_SECONDS;
  const { stars, earned } = summary;

  useEffect(() => {
    audio.sfx(earned?.chest ? "chest" : "fanfare");
    const msg = needsBreak
      ? "Hebat sekali! Kamu sudah belajar lama. Yuk, istirahat dulu dan main di luar!"
      : earned?.chest ? "Wah! Kamu menemukan peti harta karun!" : "Misi selesai! Kamu hebat!";
    const t = setTimeout(() => audio.say(msg), 600);
    return () => clearTimeout(t);
  }, [earned, needsBreak]);

  return (
    <div className="flex flex-1 flex-col items-center gap-5 text-center">
      <h1 className="text-4xl font-extrabold">Misi Selesai! 🎉</h1>
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: i < stars ? 1 : 0.7, rotate: 0 }}
            transition={{ delay: 0.3 + i * 0.25, type: "spring", stiffness: 220 }}
            className="text-7xl"
            style={{ filter: i < stars ? "drop-shadow(0 4px 8px rgb(229 169 26 / .6))" : "grayscale(1) opacity(.3)" }}
          >
            ⭐
          </motion.span>
        ))}
      </div>

      {earned && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
          className="flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-lilac px-4 py-2 font-display text-xl font-extrabold text-white">+{earned.xp} XP</span>
          {earned.chest && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 1.4 }}
              className="rounded-full bg-sun px-4 py-2 font-display text-xl font-extrabold">🧰 Peti harta! +{CHEST_SHELLS} 🐚</motion.span>
          )}
        </motion.div>
      )}

      {earned?.badges.length ? (
        <div className="flex flex-wrap justify-center gap-3">
          {earned.badges.map((b, i) => (
            <motion.div key={b} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.6 + i * 0.2, type: "spring" }}
              className="flex flex-col items-center rounded-3xl bg-white px-4 py-3 shadow-lg">
              <span className="text-5xl">{BADGES[b]?.emoji}</span>
              <span className="font-display text-lg font-extrabold">{BADGES[b]?.name}</span>
            </motion.div>
          ))}
        </div>
      ) : null}

      <Mascot size={130} mood={needsBreak ? "sleepy" : "cheer"} />

      {needsBreak && (
        <p className="rounded-3xl bg-white/85 px-5 py-3 text-lg">
          😴 Kamu sudah belajar lebih dari 10 menit. Waktunya istirahat — sampai jumpa lagi!
        </p>
      )}
      {summary.saveError && (
        <p className="rounded-2xl bg-shell px-4 py-2 text-sm">Progres belum tersimpan ({summary.saveError}). Coba lagi nanti.</p>
      )}

      <div className="mt-auto flex w-full flex-col gap-3 pb-4">
        {onNext && !needsBreak && (
          <Button tone="lagoon" size="lg" onClick={onNext}>Misi Berikutnya <ArrowRight size={30} /></Button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button tone="white" size="md" onClick={onReplay}><RotateCcw /> Main Lagi</Button>
          <Button tone="sea" size="md" onClick={onMap}><Map /> {lesson.mechanic === "treasure_quiz" ? "Ke Peta" : "Pulau"}</Button>
        </div>
      </div>
    </div>
  );
}
