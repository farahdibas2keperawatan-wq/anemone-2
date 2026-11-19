"use client";
import { useMemo, useState } from "react";
import type { MatchItem } from "@/content/types";
import { audio } from "@/lib/audio";
import { type GameProps, OptionCard, Prompt, shuffle } from "./shared";

/** Pasangkan — tap a sound/word, then tap its friend (character or picture). */
export function MatchPairs({ item, onDone, feedback }: GameProps<MatchItem>) {
  const left = useMemo(() => shuffle(item.pairs.map((p) => p.text)), [item]);
  const right = useMemo(() => shuffle(item.pairs.map((p) => p.emoji)), [item]);
  const answerOf = useMemo(() => new Map(item.pairs.map((p) => [p.text, p.emoji])), [item]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [shake, setShake] = useState<string | null>(null);
  const [wrongTaps, setWrongTaps] = useState(0);

  async function pickLeft(t: string) {
    if (matched.includes(t)) return;
    setSelected(t);
    audio.say(t);
  }

  async function pickRight(e: string) {
    if (!selected) { feedback("say", "Ketuk tulisannya dulu, ya!"); return; }
    if ([...matched].some((t) => answerOf.get(t) === e)) return;
    if (answerOf.get(selected) === e) {
      const next = [...matched, selected];
      setMatched(next);
      setSelected(null);
      audio.sfx("correct");
      if (next.length === item.pairs.length) {
        await feedback("correct");
        onDone({ correctFirstTry: wrongTaps === 0, attempts: item.pairs.length + wrongTaps, wrongTaps });
      }
    } else {
      audio.sfx("gentle");
      setWrongTaps((n) => n + 1);
      setShake(e);
      setTimeout(() => setShake(null), 500);
      feedback("retry");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-5">
      <Prompt>Ketuk tulisan, lalu ketuk temannya!</Prompt>
      <div className="grid w-full grid-cols-2 gap-x-6 gap-y-4">
        <div className="flex flex-col gap-4">
          {left.map((t) => (
            <OptionCard key={t} label={t} onClick={() => pickLeft(t)}
              state={matched.includes(t) ? "matched" : selected === t ? "selected" : "idle"} className="text-5xl">
              {t}
            </OptionCard>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {right.map((e) => {
            const done = matched.some((t) => answerOf.get(t) === e);
            return (
              <OptionCard key={e} label="gambar" onClick={() => pickRight(e)}
                state={done ? "matched" : shake === e ? "wrong" : "idle"} className="text-6xl">
                <span aria-hidden>{e}</span>
              </OptionCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
