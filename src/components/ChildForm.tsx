"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AVATARS, Button } from "./ui";

/** Parent-only form to create/edit a child profile. Only a nickname + avatar — no personal data. */
export function ChildForm({ open, initial, onSave, onClose }: {
  open: boolean;
  initial?: { nickname: string; avatar: string };
  onSave: (nickname: string, avatar: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.nickname ?? "");
  const [avatar, setAvatar] = useState(initial?.avatar ?? AVATARS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setName(initial?.nickname ?? ""); setAvatar(initial?.avatar ?? AVATARS[0]); setErr(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true">
          <motion.form
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="relative w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) { setErr("Isi nama panggilan dulu."); return; }
              setBusy(true); setErr(null);
              try { await onSave(name.trim(), avatar); onClose(); }
              catch (e) { setErr((e as Error).message); }
              finally { setBusy(false); }
            }}
          >
            <button type="button" onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-full p-2 text-ink-soft"><X /></button>
            <h2 className="text-2xl font-extrabold">{initial ? "Ubah Profil" : "Profil Anak Baru"}</h2>
            <label className="mt-4 block text-base font-bold" htmlFor="nick">Nama panggilan</label>
            <input
              id="nick" value={name} maxLength={20} autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Kaka"
              className="mt-1 w-full rounded-2xl border-2 border-sea/40 px-4 py-3 text-xl outline-none focus:border-sea"
            />
            <p className="mt-1 text-xs text-ink-soft">Cukup nama panggilan. Jangan isi nama lengkap atau data pribadi.</p>
            <p className="mt-4 text-base font-bold">Pilih teman</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {AVATARS.map((a) => (
                <button type="button" key={a} onClick={() => setAvatar(a)} aria-label={`Avatar ${a}`} aria-pressed={avatar === a}
                  className={`grid aspect-square place-items-center rounded-2xl text-3xl transition ${avatar === a ? "bg-sun ring-4 ring-sun-dark/40" : "bg-foam"}`}>
                  {a}
                </button>
              ))}
            </div>
            {err && <p className="mt-3 text-sm text-coral-dark">{err}</p>}
            <Button tone="lagoon" size="md" className="mt-5 w-full" disabled={busy} type="submit">
              {busy ? "Menyimpan…" : "Simpan"}
            </Button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
