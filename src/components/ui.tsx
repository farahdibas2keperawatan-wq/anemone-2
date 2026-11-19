"use client";
import { useEffect, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Music2, Volume2, VolumeX } from "lucide-react";
import { audio } from "@/lib/audio";
import { Mascot } from "./Mascot";

type Tone = "sea" | "lagoon" | "coral" | "sun" | "lilac" | "white" | "sand";

export function Button({
  tone = "sea", size = "lg", className = "", children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone; size?: "md" | "lg" | "xl" }) {
  const sizes = {
    md: "min-h-14 px-5 text-xl rounded-2xl",
    lg: "min-h-16 px-7 text-2xl rounded-3xl",
    xl: "min-h-24 px-10 text-4xl rounded-[2rem]",
  };
  const text = tone === "white" || tone === "sand" || tone === "sun" ? "text-ink" : "text-white";
  return (
    <button
      {...rest}
      className={`btn-chunky tone-${tone} ${sizes[size]} ${text} inline-flex items-center justify-center gap-3 font-display font-extrabold ${className}`}
      onClick={(e) => { audio.unlock(); audio.sfx("pop"); rest.onClick?.(e); }}
    >
      {children}
    </button>
  );
}

/** Round icon button (back, sound...). Always ≥ 56px — big enough for small fingers. */
export function IconButton({ label, children, tone = "white", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: Tone }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={`btn-chunky tone-${tone} grid h-14 w-14 place-items-center rounded-full text-ink ${rest.className ?? ""}`}
      onClick={(e) => { audio.unlock(); rest.onClick?.(e); }}
    >
      {children}
    </button>
  );
}

const BUBBLES = [
  { l: "6%", s: 14, d: 16, delay: 0 }, { l: "18%", s: 22, d: 22, delay: 4 }, { l: "35%", s: 10, d: 14, delay: 8 },
  { l: "62%", s: 18, d: 19, delay: 2 }, { l: "78%", s: 12, d: 15, delay: 6 }, { l: "90%", s: 24, d: 24, delay: 10 },
];

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        {BUBBLES.map((b, i) => (
          <span key={i} className="bubble" style={{ left: b.l, width: b.s, height: b.s, animationDuration: `${b.d}s`, animationDelay: `${b.delay}s` }} />
        ))}
        {/* sea floor */}
        <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 60" preserveAspectRatio="none" height="70">
          <path d="M0 40 Q 50 20 100 38 T 200 36 T 300 34 T 400 30 V60 H0Z" fill="#ffe7b8" />
          <path d="M0 50 Q 60 38 120 50 T 260 48 T 400 46 V60 H0Z" fill="#ffd98a" />
        </svg>
      </div>
      <main className={`relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-24 pt-4 ${className}`}>{children}</main>
    </div>
  );
}

function useAudioSettings() {
  return useSyncExternalStore(
    (cb) => audio.subscribe(cb),
    () => `${audio.voiceOn}|${audio.musicOn}`,
    () => "true|true",
  );
}

export function AudioToggles() {
  const s = useAudioSettings();
  const [voiceOn, musicOn] = s.split("|").map((x) => x === "true");
  return (
    <div className="flex gap-2">
      <IconButton label={musicOn ? "Matikan musik" : "Nyalakan musik"} onClick={() => audio.setMusic(!musicOn)}>
        {musicOn ? <Music size={26} /> : <Music2 size={26} className="opacity-40" />}
      </IconButton>
      <IconButton label={voiceOn ? "Matikan suara" : "Nyalakan suara"} onClick={() => audio.setVoice(!voiceOn)}>
        {voiceOn ? <Volume2 size={26} /> : <VolumeX size={26} />}
      </IconButton>
    </div>
  );
}

export function TopBar({ back, children }: { back?: string | (() => void); children?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {back && (
          <IconButton label="Kembali" onClick={() => (typeof back === "string" ? router.push(back) : back())}>
            <ArrowLeft size={28} strokeWidth={3} />
          </IconButton>
        )}
        {children}
      </div>
      <AudioToggles />
    </header>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 font-display text-xl font-extrabold text-ink shadow ${className}`}>
      {children}
    </span>
  );
}

export function StarRow({ value, max = 3, size = 28 }: { value: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} dari ${max} bintang`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ fontSize: size, filter: i < value ? "none" : "grayscale(1) opacity(0.35)" }}>⭐</span>
      ))}
    </span>
  );
}

export function Loading({ label = "Sebentar ya…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20" role="status">
      <Mascot size={120} mood="think" />
      <p className="font-display text-2xl text-ink-soft">{label}</p>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[2rem] bg-white/80 p-8 text-center shadow">
      <Mascot size={110} mood="think" />
      <h2 className="text-2xl font-extrabold">{title}</h2>
      {text && <p className="text-lg text-ink-soft">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl bg-shell px-4 py-3 text-base text-ink">
      <b>Ups, ada kendala:</b> {message}
    </div>
  );
}

/** Speaks `text` once when mounted (after a short delay) — used for spoken instructions. */
export function useSpeakOnMount(text: string | undefined, url?: string, delay = 350) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(() => audio.say(text, { url }), delay);
    return () => { clearTimeout(t); audio.stopSpeech(); };
  }, [text, url, delay]);
}

export function Pop({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay }}>
      {children}
    </motion.div>
  );
}

export const AVATARS = ["🐙", "🐢", "🐠", "🐬", "🦀", "🐳", "🐧", "🦭", "⭐", "🐡"];
