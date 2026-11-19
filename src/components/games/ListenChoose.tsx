"use client";
import { useEffect, useMemo, useState } from "react";
import type { ListenChooseItem } from "@/content/types";
import { audio } from "@/lib/audio";
import { type GameProps, OptionCard, Prompt, SpeakerButton, shuffle } from "./shared";

/** Dengar & Pilih — hear a sound/word, tap the matching written card. */
export function ListenChoose({ item, onDone, feedback }: GameProps<ListenChooseItem>) {
  const options = useMemo(() => shuffle(item.options), [item]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [shaking, setShaking] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const play = () => audio.say(item.say, { url: item.audioUrl });

  useEffect(() => {
    setWrong([]); setSolved(false);
    const t = setTimeout(play, 500);
    return () => { clearTimeout(t); audio.stopSpeech(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  async function choose(o: string) {
    if (solved) return;
    if (o === item.answer) {
      setSolved(true);
      audio.sfx("correct");
      await audio.say(item.answer, { url: item.audioUrl });
      await feedback("correct");
      onDone({ correctFirstTry: wrong.length === 0, attempts: wrong.length + 1, wrongTaps: wrong.length });
    } else {
      audio.sfx("gentle");
      setShaking(o);
      setWrong((w) => [...w, o]);
      setTimeout(() => setShaking(null), 500);
      await feedback("retry");
      play();
    }
  }

  const hint = wrong.length >= 2;
  return (
    <div className="flex flex-1 flex-col items-center gap-6">
      <Prompt>Dengarkan, lalu ketuk yang sama!</Prompt>
      <SpeakerButton onPlay={play} />
      <div className={`grid w-full gap-4 ${options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((o) => (
          <OptionCard
            key={o}
            label={o}
            onClick={() => choose(o)}
            state={solved && o === item.answer ? "correct" : shaking === o ? "wrong" : hint && o === item.answer ? "hint" : solved ? "dim" : "idle"}
            className="flex-col gap-1 text-5xl"
          >
            {item.emojis?.[o] && <span className="text-5xl" aria-hidden>{item.emojis[o]}</span>}
            <span>{o}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
