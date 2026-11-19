"use client";
import { useParams, useRouter } from "next/navigation";
import { useRequireChild } from "@/components/guards";
import { LessonPlayer } from "@/components/LessonPlayer";
import { Button, EmptyState, Loading, Screen, TopBar } from "@/components/ui";
import { allLessons } from "@/content/curriculum";
import { findLesson, unlockedLessonIds } from "@/lib/progress";

export default function Mission() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { childData, modules, activeChild } = useRequireChild();

  if (!activeChild || !childData) return <Screen><Loading /></Screen>;

  const found = findLesson(modules, id);
  const unlocked = unlockedLessonIds(modules, childData);

  if (!found || !unlocked.has(id) || found.lesson.items.length === 0) {
    return (
      <Screen>
        <TopBar back="/peta" />
        <EmptyState
          title={!found ? "Misi tidak ditemukan" : found.lesson.items.length === 0 ? "Misi ini belum ada isinya" : "Misi ini masih terkunci 🔒"}
          text={found && !unlocked.has(id) ? "Selesaikan misi sebelumnya dulu, ya!" : undefined}
          action={<Button size="md" onClick={() => router.push("/peta")}>Ke Peta</Button>}
        />
      </Screen>
    );
  }

  const seq = allLessons(modules);
  const next = seq[seq.findIndex((l) => l.id === id) + 1];

  return (
    <Screen className="pb-6">
      <LessonPlayer key={id} lesson={found.lesson} module={found.module} nextLessonId={next?.id} />
    </Screen>
  );
}
