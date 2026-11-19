"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Play, Trophy } from "lucide-react";
import { useRequireChild } from "@/components/guards";
import { Mascot } from "@/components/Mascot";
import { Button, Loading, Pill, Screen, TopBar } from "@/components/ui";
import { nextLesson, progressMap, totalShells, totalStars, unlockedLessonIds } from "@/lib/progress";
import { claimDailyIfAvailable, DAILY_SHELLS } from "@/lib/rewards";
import { audio } from "@/lib/audio";
import { ISLAND_BG } from "@/lib/theme";


export default function AdventureMap() {
  const router = useRouter();
  const { activeChild, childData, modules, refreshChildData } = useRequireChild();
  const [daily, setDaily] = useState(false);
  const claimed = useRef(false);

  // Daily gift: one shell for the first visit of the day. No streaks.
  useEffect(() => {
    if (!activeChild || !childData || claimed.current) return;
    claimed.current = true;
    claimDailyIfAvailable(activeChild.id, childData).then((r) => {
      if (r) { setDaily(true); audio.sfx("chest"); audio.say("Hadiah hari ini untukmu! Sebuah kerang ajaib."); refreshChildData(); }
    }).catch(() => {});
  }, [activeChild, childData, refreshChildData]);

  if (!activeChild || !childData) return <Screen><Loading /></Screen>;

  const unlocked = unlockedLessonIds(modules, childData);
  const done = progressMap(childData);
  const next = nextLesson(modules, childData);

  return (
    <Screen>
      <TopBar back="/anak">
        <Pill><span className="text-2xl">{activeChild.avatar}</span> {activeChild.nickname}</Pill>
      </TopBar>

      <div className="mb-4 flex items-center justify-center gap-3">
        <Pill>⭐ {totalStars(childData)}</Pill>
        <Pill>🐚 {totalShells(childData)}</Pill>
        <button onClick={() => router.push("/hadiah")} aria-label="Hadiah dan lencana"
          className="btn-chunky tone-sun grid h-14 w-14 place-items-center rounded-full text-ink">
          <Trophy size={28} />
        </button>
      </div>

      {next ? (
        <div className="mb-6 flex items-center gap-3 rounded-[2rem] bg-white/85 p-3 shadow-lg">
          <Mascot size={70} />
          <div className="flex-1">
            <p className="text-sm font-bold text-ink-soft">Misi berikutnya</p>
            <p className="font-display text-xl font-extrabold leading-tight">{next.title}</p>
          </div>
          <Button tone="lagoon" size="md" onClick={() => router.push(`/misi/${next.id}`)} aria-label={`Mainkan ${next.title}`}>
            <Play fill="currentColor" />
          </Button>
        </div>
      ) : (
        <div className="mb-6 rounded-[2rem] bg-white/85 p-4 text-center font-display text-xl font-extrabold shadow-lg">
          🏆 Semua pulau sudah dijelajahi! Main lagi kapan saja.
        </div>
      )}

      {/* Islands along a winding path */}
      <div className="relative flex flex-col gap-10 pb-10">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
          <path d="M30 2 C 90 15, 90 25, 70 35 S 10 50, 30 62 S 90 80, 50 98" stroke="white" strokeWidth="1.2" strokeDasharray="2 2.5" fill="none" vectorEffect="non-scaling-stroke" opacity="0.9" />
        </svg>
        {modules.map((m, i) => {
          const isOpen = m.lessons.some((l) => unlocked.has(l.id));
          const stars = m.lessons.reduce((s, l) => s + (done.get(l.id)?.bestStars ?? 0), 0);
          const complete = m.lessons.every((l) => done.get(l.id)?.status === "completed");
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => {
                audio.unlock();
                if (isOpen) { audio.sfx("pop"); router.push(`/pulau/${m.id}`); }
                else { audio.sfx("gentle"); audio.say("Pulau ini masih terkunci. Selesaikan pulau sebelumnya dulu, ya!"); }
              }}
              aria-label={`${m.title}${isOpen ? "" : " (terkunci)"}`}
              className={`relative z-10 w-[78%] ${i % 2 ? "self-end" : "self-start"}`}
            >
              <div className={`btn-chunky tone-white rounded-[2.5rem] p-4 text-left ${isOpen ? "" : "grayscale-[0.8] opacity-70"}`}
                style={{ backgroundImage: ISLAND_BG[m.color] }}>
                <div className="flex items-center gap-3">
                  <motion.span className="text-6xl" animate={isOpen ? { rotate: [0, -6, 6, 0] } : {}} transition={{ repeat: Infinity, duration: 4 }} aria-hidden>
                    {m.emoji}
                  </motion.span>
                  <div className="flex-1">
                    <p className="font-display text-2xl font-extrabold leading-tight text-ink">{m.title}</p>
                    <p className="text-sm font-bold text-ink/70">{m.subtitle}</p>
                  </div>
                  {!isOpen && <Lock className="text-ink/70" size={30} />}
                  {complete && <span className="text-3xl" aria-label="selesai">✅</span>}
                </div>
                {isOpen && (
                  <p className="mt-2 font-display text-lg font-bold text-ink">⭐ {stars}/{m.lessons.length * 3}</p>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {daily && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="flex w-full max-w-xs flex-col items-center gap-3 rounded-[2rem] bg-white p-6 text-center shadow-2xl">
              <motion.span className="text-8xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: 2, duration: 0.6 }}>🐚</motion.span>
              <h2 className="text-3xl font-extrabold">Hadiah Hari Ini!</h2>
              <p className="text-lg">+{DAILY_SHELLS} kerang ajaib</p>
              <Button tone="lagoon" size="md" onClick={() => setDaily(false)}>Asyik!</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
}
