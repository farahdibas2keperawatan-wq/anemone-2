"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "./providers";

/** Child screens need a selected child (and, in cloud mode, a signed-in parent). */
export function useRequireChild() {
  const app = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!app.ready) return;
    if (app.mode === "cloud" && !app.authSession) router.replace("/masuk");
    else if (!app.activeChild && app.children.length >= 0) {
      // wait one tick for children to load before redirecting
      const t = setTimeout(() => { if (!app.activeChild) router.replace("/anak"); }, 600);
      return () => clearTimeout(t);
    }
  }, [app.ready, app.mode, app.authSession, app.activeChild, app.children, router]);
  return app;
}

export const MECHANIC_ICON: Record<string, string> = {
  sound_story: "🎵", listen_choose: "👂", match: "🔗", syllable_build: "🧩",
  word_explore: "🔍", read_discover: "📖", treasure_quiz: "🧰",
};
export const MECHANIC_NAME: Record<string, string> = {
  sound_story: "Petualangan Suara Ajaib", listen_choose: "Dengar & Pilih", match: "Pasangkan",
  syllable_build: "Susun Suku Kata", word_explore: "Jelajah Kata", read_discover: "Baca & Temukan",
  treasure_quiz: "Kuis Harta Karun",
};
