"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { SyllableBuildItem } from "@/content/types";
import { audio } from "@/lib/audio";
import { type GameProps, OptionCard, Prompt, shuffle, wait } from "./shared";

/**
 * Susun Kata — hear the word, build it from whole sound units (never letters),
 * then hear the units glide together into the word.
 */
export function SyllableBuilder({ item, onDone, feedback }: GameProps<SyllableBuildItem>) {
  const tiles = useMemo(() => shuffle([...item.parts, ...item.extra].map((t, i) => ({ t, key: `${t}-${i}` }))), [item]);
  const [used, setUsed] = useState<string[]>([]);    // tile keys
  const [filled, setFilled] = useState<string[]>([]); // texts
  const [shake, setShake] = useState<string | null>(null);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [done, setDone] = useState(false);
  const sayWord = () => audio.say(item.word, { url: item.audioUrl });

  useEffect(() => {
    setUsed([]); setFilled([]); setDone(false); setWrongTaps(0);
    const t = setTimeout(sayWord, 500);
    return () => { clearTimeout(t); audio.stopSpeech(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  async function tap(tile: { t: string; key: string }) {
    if (done || used.includes(tile.key)) return;
    if (tile.t === item.parts[filled.length]) {
      const next = [...filled, tile.t];
      setFilled(next);
      setUsed((u) => [...u, tile.key]);
      audio.sfx("pop");
      await audio.say(tile.t);
      if (next.length === item.parts.length) {
        setDone(true);
        audio.sfx("correct");
        await wait(200);
        await audio.say(item.parts.join("… "), { rate: 0.7 }); // slow glide
        await sayWord();
        await feedback("correct");
        onDone({ correctFirstTry: wrongTaps === 0, attempts: item.parts.length + wrongTaps, wrongTaps });
      }
    } else {
      audio.sfx("gentle");
      setWrongTaps((n) => n + 1);
      setShake(tile.key);
      setTimeout(() => setShake(null), 500);
      await feedback("retry");
      sayWord();
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <Prompt>Susun suaranya jadi kata!</Prompt>
      <button onClick={sayWord} aria-label={`Dengarkan ${item.word}`} className="text-[96px] leading-none drop-shadow-lg active:scale-95">
        {item.emoji}
      </button>
      <div className="flex gap-3" aria-live="polite">
        {item.parts.map((_, i) => (
          <motion.div
            key={i}
            animate={filled[i] ? { scale: [0.8, 1.1, 1] } : {}}
            className={`grid h-24 min-w-24 place-items-center rounded-3xl px-3 font-display text-5xl font-extrabold ${
              filled[i] ? "bg-lagoon text-white shadow-lg" : "border-4 border-dashed border-white/90 bg-white/40 text-transparent"
            }`}
          >
            {filled[i] ?? "·"}
          </motion.div>
        ))}
      </div>
      {done && (
        <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="font-display text-6xl font-extrabold text-ink">
          {item.word}
        </motion.p>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-4">
        {tiles.map((tile) => (
          <OptionCard key={tile.key} label={tile.t} onClick={() => tap(tile)}
            state={used.includes(tile.key) ? "dim" : shake === tile.key ? "wrong" : "idle"}
            disabled={used.includes(tile.key)}
            className="min-w-28 text-5xl">
            {tile.t}
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
