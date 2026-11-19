"use client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { MECHANIC_ICON, MECHANIC_NAME, useRequireChild } from "@/components/guards";
import { EmptyState, Loading, Screen, StarRow, TopBar, Button, useSpeakOnMount } from "@/components/ui";
import { progressMap, unlockedLessonIds } from "@/lib/progress";
import { audio } from "@/lib/audio";
import { ISLAND_BG } from "@/lib/theme";

export default function Island() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { childData, modules, activeChild } = useRequireChild();
  const mod = modules.find((m) => m.id === id);
  useSpeakOnMount(mod ? `Selamat datang di ${mod.title}!` : undefined);

  if (!activeChild || !childData) return <Screen><Loading /></Screen>;
  if (!mod) {
    return (
      <Screen>
        <TopBar back="/peta" />
        <EmptyState title="Pulau tidak ditemukan" action={<Button size="md" onClick={() => router.push("/peta")}>Ke Peta</Button>} />
      </Screen>
    );
  }

  const unlocked = unlockedLessonIds(modules, childData);
  const done = progressMap(childData);
  const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);

  return (
    <Screen>
      <TopBar back="/peta" />
      <div className="mb-6 rounded-[2rem] p-5 text-center shadow-lg" style={{ backgroundImage: ISLAND_BG[mod.color] }}>
        <div className="text-6xl" aria-hidden>{mod.emoji}</div>
        <h1 className="text-3xl font-extrabold">{mod.title}</h1>
        <p className="font-bold text-ink/70">{mod.subtitle}</p>
      </div>

      <ol className="flex flex-col gap-5">
        {lessons.map((l, i) => {
          const open = unlocked.has(l.id);
          const p = done.get(l.id);
          const isNext = open && !p;
          return (
            <motion.li key={l.id} initial={{ opacity: 0, x: i % 2 ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
              className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
              <motion.button
                animate={isNext ? { scale: [1, 1.04, 1] } : {}}
                transition={isNext ? { repeat: Infinity, duration: 1.6 } : {}}
                onClick={() => {
                  audio.unlock();
                  if (open) { audio.sfx("pop"); router.push(`/misi/${l.id}`); }
                  else { audio.sfx("gentle"); audio.say("Misi ini masih terkunci. Selesaikan misi sebelumnya, ya!"); }
                }}
                aria-label={`${l.title}${open ? "" : " (terkunci)"}`}
                className={`btn-chunky ${isNext ? "tone-sun" : "tone-white"} flex w-[85%] items-center gap-4 rounded-[2rem] p-4 text-left text-ink ${open ? "" : "opacity-60"}`}
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white/80 text-4xl" aria-hidden>
                  {open ? MECHANIC_ICON[l.mechanic] : <Lock size={30} />}
                </span>
                <span className="flex-1">
                  <span className="block font-display text-xl font-extrabold leading-tight">{l.title}</span>
                  <span className="block text-sm font-bold text-ink-soft">{MECHANIC_NAME[l.mechanic]}</span>
                  {p && <StarRow value={p.bestStars} size={20} />}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ol>
    </Screen>
  );
}
