"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useApp } from "@/components/providers";
import { Button, EmptyState, ErrorNote, Loading, Screen, TopBar, useSpeakOnMount } from "@/components/ui";
import { ParentGate } from "@/components/ParentGate";
import { ChildForm } from "@/components/ChildForm";
import { getStore } from "@/lib/store";
import { audio } from "@/lib/audio";

export default function SelectChild() {
  const router = useRouter();
  const { ready, mode, authSession, children, selectChild, refreshChildren, error } = useApp();
  const [gate, setGate] = useState(false);
  const [form, setForm] = useState(false);
  useSpeakOnMount(children.length ? "Siapa yang mau main hari ini?" : undefined);

  if (!ready) return <Screen><Loading /></Screen>;

  if (mode === "cloud" && !authSession) {
    return (
      <Screen>
        <TopBar back="/" />
        <EmptyState
          title="Ayah/Bunda, masuk dulu ya"
          text="Masuk ke akun orang tua untuk menyimpan progres belajar anak."
          action={<Button tone="sea" size="md" onClick={() => router.push("/masuk")}>Masuk</Button>}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar back="/" />
      <h1 className="mb-6 text-center text-4xl font-extrabold">Siapa yang main? 🐚</h1>
      {error && <ErrorNote message={error} />}

      {children.length === 0 ? (
        <EmptyState
          title="Belum ada profil"
          text="Minta Ayah atau Bunda membuat profil dulu, ya!"
          action={<Button tone="sun" size="md" onClick={() => setGate(true)}><Plus /> Buat Profil</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {children.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              onClick={() => { audio.unlock(); audio.sfx("pop"); selectChild(c.id); audio.say(`Halo, ${c.nickname}!`); router.push("/peta"); }}
              className="btn-chunky tone-white flex aspect-square flex-col items-center justify-center gap-2 rounded-[2rem]"
            >
              <span className="text-7xl" aria-hidden>{c.avatar}</span>
              <span className="font-display text-2xl font-extrabold text-ink">{c.nickname}</span>
            </motion.button>
          ))}
          <button
            onClick={() => setGate(true)}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-[2rem] border-4 border-dashed border-white/80 text-ink-soft"
            aria-label="Tambah profil (orang tua)"
          >
            <Plus size={40} />
            <span className="font-display text-lg font-bold">Tambah</span>
          </button>
        </div>
      )}

      <ParentGate open={gate} onClose={() => setGate(false)} onPass={() => { setGate(false); setForm(true); }} />
      <ChildForm
        open={form}
        onClose={() => setForm(false)}
        onSave={async (nick, av) => { await getStore().createChild(nick, av); await refreshChildren(); }}
      />
    </Screen>
  );
}
