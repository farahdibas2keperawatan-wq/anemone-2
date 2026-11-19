"use client";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { audio } from "@/lib/audio";

export interface ItemOutcome {
  correctFirstTry: boolean;
  attempts: number;   // taps until done (1 = first try)
  wrongTaps: number;
}

/** Feedback channel from a game to the player (mascot speech + sound). Resolves when spoken. */
export type Feedback = (kind: "correct" | "retry" | "say", text?: string) => Promise<void>;

export interface GameProps<T> {
  item: T;
  onDone: (o: ItemOutcome) => void;
  feedback: Feedback;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type CardState = "idle" | "selected" | "wrong" | "correct" | "hint" | "matched" | "dim";

const stateStyle: Record<CardState, string> = {
  idle: "tone-white",
  selected: "tone-sun outline-4 outline-white",
  wrong: "tone-white",
  correct: "tone-lagoon text-white",
  hint: "tone-white outline-4 outline-sun",
  matched: "tone-lagoon text-white opacity-90",
  dim: "tone-white opacity-40",
};

/** The big tappable card used by every game. Wrong = soft wiggle, never red. */
export function OptionCard({
  state = "idle", onClick, children, className = "", label, disabled,
}: { state?: CardState; onClick?: () => void; children: ReactNode; className?: string; label?: string; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => { audio.unlock(); onClick?.(); }}
      animate={
        state === "wrong" ? { x: [0, -10, 10, -6, 6, 0] }
        : state === "correct" ? { scale: [1, 1.12, 1] }
        : state === "hint" ? { scale: [1, 1.06, 1] }
        : { x: 0, scale: 1 }
      }
      transition={state === "hint" ? { repeat: Infinity, duration: 1.2 } : { duration: 0.45 }}
      className={`btn-chunky ${stateStyle[state]} flex min-h-28 items-center justify-center rounded-[1.75rem] p-3 font-display font-extrabold text-ink ${className}`}
    >
      {children}
    </motion.button>
  );
}

/** Big round "listen again" button with a pulse while speaking. */
export function SpeakerButton({ onPlay, label = "Dengarkan lagi", size = 96 }: { onPlay: () => Promise<void> | void; label?: string; size?: number }) {
  const [playing, setPlaying] = useState(false);
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={async () => { audio.unlock(); setPlaying(true); await onPlay(); setPlaying(false); }}
      animate={playing ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={playing ? { repeat: Infinity, duration: 0.8 } : {}}
      className="btn-chunky tone-sea grid place-items-center rounded-full text-white"
      style={{ width: size, height: size }}
    >
      <Volume2 size={size * 0.45} strokeWidth={2.5} />
    </motion.button>
  );
}

export function Prompt({ children }: { children: ReactNode }) {
  return <p className="text-center font-display text-2xl font-bold text-ink">{children}</p>;
}
