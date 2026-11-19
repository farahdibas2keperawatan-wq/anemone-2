"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { SoundStoryItem } from "@/content/types";
import { audio } from "@/lib/audio";
import { Button } from "../ui";
import { type GameProps, OptionCard, wait } from "./shared";

/**
 * Petualangan Suara Ajaib — a character tells a tiny story and "owns" a sound.
 * The child taps the sound card to hear it and imitates it. No right/wrong here.
 */
export function SoundStory({ item, onDone, feedback }: GameProps<SoundStoryItem>) {
  const [stage, setStage] = useState<"story" | "sound" | "ready">("story");

  useEffect(() => {
    let alive = true;
    setStage("story");
    (async () => {
      await wait(400);
      await audio.say(`Ini ${item.character}.`);
      if (!alive) return;
      await audio.say(item.story);
      if (!alive) return;
      setStage("sound");
      await feedback("say", `Ketuk, lalu tirukan: ${item.sound}!`);
    })();
    return () => { alive = false; audio.stopSpeech(); };
  }, [item, feedback]);

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <motion.div
        key={item.id}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
        transition={{ y: { repeat: Infinity, duration: 2.2 }, default: { type: "spring" } }}
        className="text-[110px] leading-none drop-shadow-lg"
        aria-hidden
      >
        {item.emoji}
      </motion.div>
      <p className="font-display text-3xl font-extrabold">{item.character}</p>
      <p className="max-w-sm rounded-3xl bg-white/80 px-5 py-3 text-center text-xl text-ink-soft">{item.story}</p>

      <AnimatePresence>
        {stage !== "story" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-4">
            <OptionCard
              label={`Dengarkan ${item.sound}`}
              state={stage === "sound" ? "hint" : "idle"}
              className="min-w-48 px-10 text-7xl"
              onClick={async () => {
                await audio.say(item.sound, { url: item.audioUrl }); // audioUrl = recording of the sound unit
                setStage("ready");
              }}
            >
              {item.sound}
            </OptionCard>
            {stage === "ready" && (
              <Button tone="lagoon" onClick={async () => { audio.sfx("correct"); await feedback("correct"); onDone({ correctFirstTry: true, attempts: 1, wrongTaps: 0 }); }}>
                <Check size={30} strokeWidth={3} /> Aku bisa!
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
