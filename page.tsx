"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { AudioToggles, Button, Screen, useSpeakOnMount } from "@/components/ui";
import { useApp } from "@/components/providers";
import { audio } from "@/lib/audio";

export default function Welcome() {
  const router = useRouter();
  const { mode } = useApp();
  useSpeakOnMount("Halo! Aku Anemone. Ayo belajar membaca bersama!", undefined, 800);

  return (
    <Screen className="items-center justify-between text-center">
      <div className="flex w-full justify-end"><AudioToggles /></div>

      <div className="flex flex-col items-center gap-2">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-xl font-bold tracking-wide text-sea-dark">
          🌊 ANEMONE
        </motion.p>
        <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="text-5xl font-extrabold leading-tight drop-shadow-sm sm:text-6xl">
          Magic Reading
        </motion.h1>
        <p className="font-display text-2xl text-ink-soft">Petualangan Seru Belajar Membaca!</p>
      </div>

      <div className="relative my-6">
        <span className="absolute -left-16 top-10 text-5xl" aria-hidden>🐠</span>
        <span className="absolute -right-14 top-2 text-4xl" aria-hidden>⭐</span>
        <span className="absolute -right-16 bottom-4 text-5xl" aria-hidden>🐢</span>
        <Mascot size={220} mood="cheer" />
      </div>

      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        <Button tone="lagoon" size="xl" className="w-full" onClick={() => { audio.unlock(); router.push("/anak"); }}>
          Ayo Main! ▶
        </Button>
        <Link href="/orang-tua" className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-base font-bold text-ink-soft">
          <Settings size={18} /> Area Orang Tua
        </Link>
        {mode === "demo" && (
          <p className="text-sm text-ink-soft">Mode demo · progres tersimpan di perangkat ini</p>
        )}
      </div>
    </Screen>
  );
}
