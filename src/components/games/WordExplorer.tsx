"use client";
import { useEffect, useMemo, useState } from "react";
import type { WordExploreItem } from "@/content/types";
import { audio } from "@/lib/audio";
import { type GameProps, OptionCard, Prompt, shuffle } from "./shared";

/** Jelajah Kata — read a whole word (tap to hear it), pick the matching picture. */
export function WordExplorer({ item, onDone, feedback }: GameProps<WordExploreItem>) {
  const options = useMemo(() => shuffle(item.options), [item]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const sayWord = () => audio.say(item.word, { url: item.audioUrl });

  useEffect(() => { setWrong([]); setSolved(false); }, [item]);

  async function choose(w: string) {
    if (solved) return;
    if (w === item.word) {
      setSolved(true);
      audio.sfx("correct");
      await sayWord();
      await feedback("correct");
      onDone({ correctFirstTry: wrong.length === 0, attempts: wrong.length + 1, wrongTaps: wrong.length });
    } else {
      audio.sfx("gentle");
      setWrong((x) => [...x, w]);
      setShake(w);
      setTimeout(() => setShake(null), 500);
      await feedback("retry");
    }
  }

  const hint = wrong.length >= 2;
  return (
    <div className="flex flex-1 flex-col items-center gap-6">
      <Prompt>Baca katanya, lalu pilih gambarnya!</Prompt>
      <button
        onClick={sayWord}
        aria-label={`Dengarkan kata ${item.word}`}
        className="btn-chunky tone-sand rounded-[2rem] px-12 py-6 font-display text-7xl font-extrabold text-ink"
      >
        {item.word}
      </button>
      <p className="-mt-3 text-base text-ink-soft">Ketuk kata untuk mendengar 🔊</p>
      <div className={`grid w-full gap-4 ${options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((o) => (
          <OptionCard key={o.word} label="gambar" onClick={() => choose(o.word)}
            state={solved && o.word === item.word ? "correct" : shake === o.word ? "wrong" : hint && o.word === item.word ? "hint" : solved ? "dim" : "idle"}
            className="text-7xl">
            <span aria-hidden>{o.emoji}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
