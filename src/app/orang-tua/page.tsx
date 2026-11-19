"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, LogOut, Pencil, Plus, Target, Trash2, Trophy, Map as MapIcon, AlertTriangle } from "lucide-react";
import { useApp } from "@/components/providers";
import { ParentGate } from "@/components/ParentGate";
import { ChildForm } from "@/components/ChildForm";
import { MECHANIC_ICON } from "@/components/guards";
import { ErrorNote, Loading, Screen, StarRow } from "@/components/ui";
import { getStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabase/client";
import { computeStats, findLesson, formatDuration, itemLabel, nextLesson, progressMap, totalStars } from "@/lib/progress";
import { audio } from "@/lib/audio";
import type { ChildData } from "@/lib/types";

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow">
      <div className="flex items-center gap-2 text-sm font-bold text-ink-soft">{icon}{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold leading-none">{value}</div>
      {sub && <div className="mt-1 text-xs text-ink-soft">{sub}</div>}
    </div>
  );
}

export default function ParentDashboard() {
  const router = useRouter();
  const app = useApp();
  const { ready, mode, authSession, children, modules, contentSource, refreshChildren, selectChild, activeChild } = app;
  const [passed, setPassed] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [data, setData] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<null | "new" | "edit">(null);

  useEffect(() => { audio.stopSpeech(); }, []);
  useEffect(() => {
    if (!sel && children.length) setSel(children[0].id);
    if (sel && !children.some((c) => c.id === sel)) setSel(children[0]?.id ?? null);
  }, [children, sel]);
  useEffect(() => {
    if (!passed || !sel) { setData(null); return; }
    setLoading(true); setErr(null);
    getStore().getChildData(sel).then(setData).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [passed, sel]);

  const stats = useMemo(() => computeStats(modules, data), [modules, data]);
  const child = children.find((c) => c.id === sel);

  const needLogin = ready && mode === "cloud" && !authSession;
  useEffect(() => { if (needLogin) router.replace("/masuk"); }, [needLogin, router]);

  if (!ready || needLogin) return <Screen><Loading /></Screen>;

  if (!passed) {
    return (
      <Screen>
        <ParentGate open onPass={() => setPassed(true)} onClose={() => router.push("/")} />
      </Screen>
    );
  }

  const done = progressMap(data);
  const next = nextLesson(modules, data);
  const weak = new Set(stats.needsPractice.map((x) => x.label));
  const practice = modules.flatMap((m) => m.lessons)
    .filter((l) => done.has(l.id) && l.items.some((it) => weak.has(itemLabel(it))))
    .slice(0, 3);

  return (
    <div className="min-h-dvh bg-foam">
      <main className="mx-auto max-w-4xl px-4 py-6 text-ink">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <button onClick={() => router.push("/")} className="flex items-center gap-1 rounded-full bg-white px-4 py-2 font-bold shadow"><ArrowLeft size={18} /> Ke aplikasi</button>
          <h1 className="flex-1 text-3xl font-extrabold">Dashboard Orang Tua</h1>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold shadow">{mode === "demo" ? "Mode demo (perangkat ini)" : authSession?.user.email}</span>
          {mode === "cloud" && (
            <button onClick={async () => { await getSupabase().auth.signOut(); selectChild(null); router.push("/"); }}
              className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-bold shadow"><LogOut size={16} /> Keluar</button>
          )}
        </header>

        {/* child tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <button key={c.id} onClick={() => setSel(c.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-display text-lg font-extrabold shadow ${sel === c.id ? "bg-sea text-white" : "bg-white"}`}>
              <span>{c.avatar}</span>{c.nickname}
            </button>
          ))}
          <button onClick={() => setForm("new")} className="flex items-center gap-1 rounded-full border-2 border-dashed border-sea px-4 py-2 font-bold text-sea-dark">
            <Plus size={18} /> Tambah anak
          </button>
        </div>

        {err && <ErrorNote message={err} />}
        {!children.length && <p className="rounded-3xl bg-white p-6 text-center shadow">Belum ada profil anak. Klik “Tambah anak” untuk mulai.</p>}
        {child && loading && <Loading label="Memuat data…" />}

        {child && data && !loading && (
          <div className="flex flex-col gap-6">
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat icon={<MapIcon size={16} />} label="Misi selesai" value={`${stats.completedLessons}/${stats.totalLessons}`} sub={stats.currentModule ? `Tahap: ${stats.currentModule.title}` : undefined} />
              <Stat icon={<Target size={16} />} label="Akurasi (coba pertama)" value={stats.accuracy === null ? "—" : `${stats.accuracy}%`} sub="dari soal yang dinilai" />
              <Stat icon={<Clock size={16} />} label="Durasi belajar" value={formatDuration(stats.totalSeconds)} sub={`${stats.sessionsCount} sesi`} />
              <Stat icon={<Trophy size={16} />} label="Bintang" value={`⭐ ${totalStars(data)}`} sub={`Terakhir aktif: ${fmtDate(stats.lastActivity)}`} />
            </section>

            <section className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-3 text-xl font-extrabold">Rekomendasi berikutnya</h2>
              <ul className="space-y-2">
                {next && <li>▶️ Lanjutkan: <b>{next.title}</b> ({findLesson(modules, next.id)?.module.title})</li>}
                {practice.map((l) => <li key={l.id}>🔁 Ulangi untuk latihan: <b>{l.title}</b></li>)}
                {!next && !practice.length && <li>🎉 Semua misi selesai. Ajak anak membaca buku cerita bersama!</li>}
                <li className="text-sm text-ink-soft">Tips: sesi 5–10 menit sehari lebih efektif daripada sesi panjang.</li>
              </ul>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow">
                <h2 className="mb-3 text-xl font-extrabold">Progres per pulau</h2>
                <ul className="space-y-3">
                  {modules.map((m) => {
                    const c = m.lessons.filter((l) => done.get(l.id)?.status === "completed").length;
                    const pct = m.lessons.length ? Math.round((c / m.lessons.length) * 100) : 0;
                    return (
                      <li key={m.id}>
                        <div className="flex justify-between text-sm font-bold"><span>{m.emoji} {m.title}</span><span>{c}/{m.lessons.length}</span></div>
                        <div className="mt-1 h-3 overflow-hidden rounded-full bg-foam" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                          <div className="h-full rounded-full bg-lagoon" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="rounded-3xl bg-white p-5 shadow">
                <h2 className="mb-3 text-xl font-extrabold">Perlu diulang</h2>
                {stats.needsPractice.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {stats.needsPractice.map((x) => (
                      <li key={x.label} className="rounded-2xl bg-shell px-3 py-2">
                        <span className="font-display text-xl font-extrabold">{x.label}</span>
                        <span className="ml-2 text-xs text-ink-soft">{x.accuracy}% · {x.tries}×</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-ink-soft">Belum ada yang perlu diulang. 👍</p>
                )}
                <p className="mt-3 text-xs text-ink-soft">Bunyi/kata dengan jawaban benar pada percobaan pertama &lt; 70%.</p>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-3 text-xl font-extrabold">Riwayat belajar</h2>
              {data.attempts.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-ink-soft">
                      <tr><th className="py-2">Waktu</th><th>Misi</th><th>Bintang</th><th>Benar / salah</th><th>Durasi</th></tr>
                    </thead>
                    <tbody>
                      {[...data.attempts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20).map((a) => {
                        const f = findLesson(modules, a.lessonId);
                        return (
                          <tr key={a.id} className="border-t border-foam">
                            <td className="py-2">{fmtDate(a.createdAt)}</td>
                            <td>{f ? `${MECHANIC_ICON[f.lesson.mechanic]} ${f.lesson.title}` : a.lessonId}</td>
                            <td><StarRow value={a.stars} size={14} /></td>
                            <td>{a.correct} / {a.incorrect}</td>
                            <td>{formatDuration(a.durationSeconds)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-ink-soft">Belum ada misi yang dimainkan.</p>}
            </section>

            <section className="flex flex-wrap gap-3">
              <button onClick={() => setForm("edit")} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold shadow"><Pencil size={16} /> Ubah profil {child.nickname}</button>
              <button
                onClick={async () => {
                  if (!confirm(`Hapus profil ${child.nickname} beserta seluruh progresnya? Tindakan ini tidak bisa dibatalkan.`)) return;
                  try { await getStore().deleteChild(child.id); if (activeChild?.id === child.id) selectChild(null); await refreshChildren(); }
                  catch (e) { setErr((e as Error).message); }
                }}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-coral-dark shadow"><Trash2 size={16} /> Hapus profil</button>
            </section>
          </div>
        )}

        {/* Curriculum review notes */}
        <section className="mt-8 rounded-3xl border-2 border-sun bg-sand p-5">
          <h2 className="flex items-center gap-2 text-xl font-extrabold"><AlertTriangle size={20} /> Catatan kurikulum (perlu ditinjau)</h2>
          <p className="mt-1 text-sm">
            Sumber konten: <b>{contentSource === "database" ? "database Supabase" : "file konfigurasi bawaan"}</b>.
            Urutan & isi di bawah adalah asumsi sementara sampai materi resmi Cara Baca Ajaib Anemone dimasukkan.
            Suara memakai text-to-speech browser{audio.hasIndonesianVoice ? " (suara Bahasa Indonesia terdeteksi)" : " — suara Bahasa Indonesia belum terdeteksi di perangkat ini"} dan bisa diganti rekaman profesional.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {modules.map((m) => (
              <li key={m.id}><b>{m.emoji} {m.title}:</b> {m.description}{m.assumption && <em className="block text-ink-soft">Asumsi: {m.assumption}</em>}</li>
            ))}
          </ul>
        </section>
      </main>

      <ChildForm
        key={form === "edit" ? `edit-${sel}` : "new"}
        open={form !== null}
        initial={form === "edit" && child ? { nickname: child.nickname, avatar: child.avatar } : undefined}
        onClose={() => setForm(null)}
        onSave={async (nick, av) => {
          if (form === "edit" && child) await getStore().updateChild(child.id, { nickname: nick, avatar: av });
          else { const c = await getStore().createChild(nick, av); setSel(c.id); }
          await refreshChildren();
        }}
      />
    </div>
  );
}
