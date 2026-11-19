"use client";
import { motion } from "framer-motion";
import { useRequireChild } from "@/components/guards";
import { Loading, Pill, Screen, TopBar, useSpeakOnMount } from "@/components/ui";
import { BADGES } from "@/lib/rewards";
import { totalShells, totalStars, totalXp } from "@/lib/progress";

export default function Rewards() {
  const { activeChild, childData, modules } = useRequireChild();
  useSpeakOnMount("Ini koleksi hadiahmu! Hebat!");
  if (!activeChild || !childData) return <Screen><Loading /></Screen>;

  const earned = new Set(childData.rewards.filter((r) => r.type === "badge").map((r) => r.value));
  const chests = new Set(childData.rewards.filter((r) => r.type === "chest").map((r) => r.value));

  return (
    <Screen>
      <TopBar back="/peta" />
      <h1 className="mb-4 text-center text-4xl font-extrabold">Koleksi {activeChild.nickname} {activeChild.avatar}</h1>

      <div className="mb-6 flex flex-wrap justify-center gap-3">
        <Pill>⭐ {totalStars(childData)} bintang</Pill>
        <Pill>🐚 {totalShells(childData)} kerang</Pill>
        <Pill>✨ {totalXp(childData)} XP</Pill>
      </div>

      <h2 className="mb-3 text-2xl font-extrabold">Peti Harta Karun</h2>
      <div className="mb-8 grid grid-cols-5 gap-3">
        {modules.map((m) => (
          <div key={m.id} className="flex flex-col items-center rounded-3xl bg-white/85 p-2 shadow">
            <span className="text-4xl" style={{ filter: chests.has(m.id) ? "none" : "grayscale(1) opacity(.35)" }}>🧰</span>
            <span className="text-2xl" aria-label={m.title}>{m.emoji}</span>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-2xl font-extrabold">Lencana</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Object.entries(BADGES).map(([id, b], i) => {
          const has = earned.has(id);
          return (
            <motion.div key={id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className={`flex flex-col items-center gap-1 rounded-[1.75rem] p-4 text-center shadow ${has ? "bg-white" : "bg-white/50"}`}>
              <span className="text-5xl" style={{ filter: has ? "none" : "grayscale(1) opacity(.3)" }}>{b.emoji}</span>
              <span className="font-display text-lg font-extrabold leading-tight">{b.name}</span>
              <span className="text-xs text-ink-soft">{has ? b.desc : "Belum didapat"}</span>
            </motion.div>
          );
        })}
      </div>
    </Screen>
  );
}
