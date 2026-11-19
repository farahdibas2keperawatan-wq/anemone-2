"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers";
import { Mascot } from "@/components/Mascot";
import { Button, ErrorNote, Screen, TopBar } from "@/components/ui";
import { getSupabase } from "@/lib/supabase/client";

/** Parent sign-in / sign-up (cloud mode only). Children never see or use this screen alone. */
export default function ParentLogin() {
  const router = useRouter();
  const { mode, authSession } = useApp();
  const [tab, setTab] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  useEffect(() => { if (mode === "cloud" && authSession) router.replace("/anak"); }, [mode, authSession, router]);

  if (mode === "demo") {
    return (
      <Screen>
        <TopBar back="/" />
        <div className="rounded-[2rem] bg-white p-6 text-center shadow">
          <h1 className="text-2xl font-extrabold">Mode demo</h1>
          <p className="mt-2">Supabase belum dikonfigurasi, jadi akun orang tua tidak diperlukan. Progres tersimpan di perangkat ini.</p>
          <Button className="mt-4" size="md" onClick={() => router.push("/anak")}>Lanjut</Button>
        </div>
      </Screen>
    );
  }
  if (authSession) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setInfo(null);
    const sb = getSupabase();
    try {
      if (tab === "in") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/anak");
      } else {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${location.origin}/anak` } });
        if (error) throw error;
        if (data.session) router.replace("/anak");
        else setInfo("Cek email Anda untuk konfirmasi akun, lalu masuk.");
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <TopBar back="/" />
      <div className="mx-auto mt-16 w-full max-w-sm">
        <div className="flex justify-center"><Mascot size={110} say="Halo Ayah & Bunda!" /></div>
        <form onSubmit={submit} className="mt-4 rounded-[2rem] bg-white p-6 shadow-xl">
          <div className="mb-4 grid grid-cols-2 rounded-full bg-foam p-1 text-center font-bold">
            <button type="button" onClick={() => setTab("in")} className={`rounded-full py-2 ${tab === "in" ? "bg-white shadow" : ""}`}>Masuk</button>
            <button type="button" onClick={() => setTab("up")} className={`rounded-full py-2 ${tab === "up" ? "bg-white shadow" : ""}`}>Daftar</button>
          </div>
          <label className="block text-sm font-bold" htmlFor="email">Email orang tua</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
            className="mt-1 w-full rounded-2xl border-2 border-sea/40 px-4 py-3 outline-none focus:border-sea" />
          <label className="mt-3 block text-sm font-bold" htmlFor="pw">Kata sandi</label>
          <input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={tab === "in" ? "current-password" : "new-password"}
            className="mt-1 w-full rounded-2xl border-2 border-sea/40 px-4 py-3 outline-none focus:border-sea" />
          {err && <div className="mt-3"><ErrorNote message={err} /></div>}
          {info && <p className="mt-3 rounded-2xl bg-foam px-4 py-3 text-sm">{info}</p>}
          <Button tone="lagoon" size="md" className="mt-5 w-full" disabled={busy} type="submit">
            {busy ? "Sebentar…" : tab === "in" ? "Masuk" : "Buat Akun"}
          </Button>
        </form>
      </div>
    </Screen>
  );
}
