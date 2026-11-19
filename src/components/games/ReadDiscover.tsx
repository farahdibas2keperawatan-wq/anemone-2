"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { ReadDiscoverItem } from "@/content/types";
import { audio } from "@/lib/audio";
import { Button } from "../ui";
import { type GameProps, Prompt, wait } from "./shared";

/**
 * Baca & Temukan — listen to the sentence with word-by-word highlighting,
 * then the child "reads" it by tapping each word in order (each one is spoken).
 */
export function ReadDiscover({ item, onDone, feedback }: GameProps<ReadDiscoverItem>) {
  const words = item.sentence.split(/\s+/);
  const [phase, setPhase] = useState<"listen" | "read" | "done">("listen");
  const [lit, setLit] = useState<number>(-1);
  const [readUpTo, setReadUpTo] = useState(0);
  const alive = useRef(true);

  async function modelRead() {
    setPhase("listen");
    for (let i = 0; i < words.length; i++) {
      if (!alive.current) return;
      setLit(i);
      await audio.say(words[i], { rate: 0.8 });
      await wait(120);
    }
    setLit(-1);
    if (!alive.current) return;
    await audio.say(item.sentence, { url: item.audioUrl });
    if (!alive.current) return;
    setPhase("read");
    setReadUpTo(0);
    feedback("say", "Sekarang giliranmu! Ketuk setiap kata.");
  }

  useEffect(() => {
    alive.current = true;
    const t = setTimeout(modelRead, 500);
    return () => { alive.current = false; clearTimeout(t); audio.stopSpeech(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  async function tapWord(i: number) {
    if (phase !== "read") { audio.say(words[i]); return; }
    if (i !== readUpTo) { audio.sfx("gentle"); return; } // next word pulses as the hint
    audio.sfx("pop");
    setReadUpTo(i + 1);
    await audio.say(words[i]);
    if (i + 1 === words.length) {
      setPhase("done");
      await audio.say(item.sentence, { url: item.audioUrl });
      await feedback("correct");
      onDone({ correctFirstTry: true, attempts: 1, wrongTaps: 0 });
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-6">
      <Prompt>{phase === "listen" ? "Dengarkan Anemone membaca…" : "Baca bersama! Ketuk setiap kata."}</Prompt>
      <div className="text-[96px] leading-none drop-shadow-lg" aria-hidden>{item.emoji}</div>
      <div className="flex flex-wrap justify-center gap-3 rounded-[2rem] bg-white/85 p-5 shadow-lg">
        {words.map((w, i) => {
          const isLit = phase === "listen" && lit === i;
          const isRead = phase !== "listen" && i < readUpTo;
          const isNext = phase === "read" && i === readUpTo;
          return (
            <motion.button
              key={i}
              onClick={() => tapWord(i)}
              animate={isNext ? { y: [0, -6, 0] } : isLit ? { scale: 1.15 } : { scale: 1, y: 0 }}
              transition={isNext ? { repeat: Infinity, duration: 1 } : { duration: 0.2 }}
              className={`rounded-2xl px-4 py-2 font-display text-5xl font-extrabold transition-colors ${
                isLit ? "bg-sun text-ink" : isRead ? "bg-lagoon text-white" : isNext ? "bg-sand text-ink ring-4 ring-sun" : "text-ink"
              }`}
            >
              {w}
            </motion.button>
          );
        })}
      </div>
      {phase === "read" && (
        <Button tone="white" size="md" onClick={modelRead}>
          <Volume2 /> Dengarkan lagi
        </Button>
      )}
    </div>
  );
}
