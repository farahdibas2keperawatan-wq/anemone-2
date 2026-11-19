"use client";
import { AUDIO_MANIFEST } from "@/content/audio-manifest";

/**
 * AudioManager — one place for all sound in the app.
 *
 * Voice priority for anything spoken:
 *   1. an explicit URL (item.audioUrl / lesson.audioUrl, e.g. Supabase Storage)
 *   2. AUDIO_MANIFEST entry for the exact text (drop pro recordings in /public/audio)
 *   3. browser text-to-speech in Bahasa Indonesia (id-ID) as a fallback
 *
 * Sound effects and background music are synthesised with WebAudio, so the app
 * ships with zero binary assets. Music never carries instructions.
 */
type Sfx = "correct" | "gentle" | "pop" | "fanfare" | "chest";

const SETTINGS_KEY = "anemone:audio";

class AudioManager {
  private ctx: AudioContext | null = null;
  private current: HTMLAudioElement | null = null;
  private musicNodes: { stop: () => void } | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private speakToken = 0;
  voiceOn = true;
  musicOn = true;
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window === "undefined") return;
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}");
      if (typeof s.voiceOn === "boolean") this.voiceOn = s.voiceOn;
      if (typeof s.musicOn === "boolean") this.musicOn = s.musicOn;
    } catch {}
    const pick = () => {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      this.voice =
        voices.find((v) => v.lang === "id-ID" && /female|wanita|damayanti|google/i.test(v.name)) ??
        voices.find((v) => v.lang?.toLowerCase().startsWith("id")) ??
        null;
    };
    pick();
    window.speechSynthesis?.addEventListener?.("voiceschanged", pick);
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }
  private emit() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ voiceOn: this.voiceOn, musicOn: this.musicOn })); } catch {}
    this.listeners.forEach((f) => f());
  }

  /** Must be called from a user gesture (browsers block audio until then). */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    this.ctx?.resume();
    if (this.musicOn && !this.musicNodes) this.startMusic();
  }

  get hasIndonesianVoice() {
    return Boolean(this.voice);
  }

  stopSpeech() {
    this.speakToken++;
    this.current?.pause();
    this.current = null;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }

  /** Speak text. Resolves when finished (or immediately if voice is off). */
  async say(text: string, opts: { url?: string; rate?: number } = {}): Promise<void> {
    this.stopSpeech();
    if (!this.voiceOn || typeof window === "undefined") return;
    const token = this.speakToken;
    const url = opts.url ?? AUDIO_MANIFEST[text.toLowerCase().trim()];
    this.duckMusic(true);
    try {
      if (url) await this.playUrl(url, token);
      else await this.tts(text, opts.rate ?? 0.85, token);
    } finally {
      if (token === this.speakToken) this.duckMusic(false);
    }
  }

  private playUrl(url: string, token: number) {
    return new Promise<void>((resolve) => {
      const a = new Audio(url);
      this.current = a;
      a.onended = a.onerror = () => resolve();
      a.play().catch(() => resolve());
      const iv = setInterval(() => { if (token !== this.speakToken) { clearInterval(iv); resolve(); } }, 100);
      a.addEventListener("ended", () => clearInterval(iv));
    });
  }

  private tts(text: string, rate: number, token: number) {
    return new Promise<void>((resolve) => {
      const synth = window.speechSynthesis;
      if (!synth) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "id-ID";
      if (this.voice) u.voice = this.voice;
      u.rate = rate;
      u.pitch = 1.15;
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      u.onend = finish;
      u.onerror = finish;
      // Safety net: some engines never fire onend.
      setTimeout(finish, 1200 + text.length * 120);
      const iv = setInterval(() => { if (token !== this.speakToken) { clearInterval(iv); finish(); } }, 100);
      u.addEventListener("end", () => clearInterval(iv));
      synth.speak(u);
    });
  }

  // ---------------- sound effects ----------------
  sfx(kind: Sfx) {
    const ctx = this.ctx;
    if (!ctx) return;
    const seq: Record<Sfx, [number, number][]> = {
      correct: [[659, 0], [880, 0.09], [1175, 0.18]],
      gentle: [[392, 0], [440, 0.12]],          // soft, never a buzzer
      pop: [[880, 0]],
      fanfare: [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38], [784, 0.52], [1047, 0.62]],
      chest: [[523, 0], [784, 0.1], [1047, 0.2], [1319, 0.3], [1568, 0.4]],
    };
    for (const [freq, at] of seq[kind]) this.tone(freq, ctx.currentTime + at, kind === "gentle" ? 0.18 : 0.14, kind === "gentle" ? 0.05 : 0.08);
  }

  private tone(freq: number, when: number, dur: number, vol: number, type: OscillatorType = "sine", dest?: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(dest ?? ctx.destination);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  // ---------------- background music ----------------
  private musicGain: GainNode | null = null;

  private startMusic() {
    const ctx = this.ctx;
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.035; // quiet: music is ambience only
    gain.connect(ctx.destination);
    this.musicGain = gain;
    // Gentle pentatonic "lullaby" loop
    const notes = [523, 587, 659, 784, 659, 587, 523, 440, 392, 440, 523, 587, 523, 440, 392, 440];
    const step = 0.45;
    let next = ctx.currentTime + 0.1;
    let i = 0;
    const timer = setInterval(() => {
      while (next < ctx.currentTime + 1.5) {
        this.tone(notes[i % notes.length], next, 0.6, 0.9, "triangle", gain);
        if (i % 4 === 0) this.tone(notes[i % notes.length] / 2, next, 1.6, 0.6, "sine", gain);
        next += step;
        i++;
      }
    }, 300);
    this.musicNodes = { stop: () => { clearInterval(timer); gain.disconnect(); } };
  }

  private duckMusic(down: boolean) {
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(down ? 0.008 : 0.035, this.ctx.currentTime, 0.15);
  }

  setMusic(on: boolean) {
    this.musicOn = on;
    if (!on) { this.musicNodes?.stop(); this.musicNodes = null; this.musicGain = null; }
    else if (this.ctx) this.startMusic();
    this.emit();
  }

  setVoice(on: boolean) {
    this.voiceOn = on;
    if (!on) this.stopSpeech();
    this.emit();
  }
}

export const audio = new AudioManager();

export const PRAISE = ["Hebat!", "Pintar sekali!", "Wah, keren!", "Kamu bisa!", "Luar biasa!", "Mantap!"];
export const ENCOURAGE = ["Ayo coba lagi, ya!", "Hampir! Coba sekali lagi.", "Dengarkan lagi, yuk!"];
export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
