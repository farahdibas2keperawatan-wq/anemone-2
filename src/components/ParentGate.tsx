"use client";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X } from "lucide-react";

function makeQuestion() {
  const a = 6 + Math.floor(Math.random() * 4); // 6–9
  const b = 5 + Math.floor(Math.random() * 5); // 5–9
  const answer = a * b;
  const options = [answer, answer + a, answer - b, answer + 10].sort(() => Math.random() - 0.5);
  return { a, b, answer, options };
}

/**
 * Simple parent gate: a multiplication question written in words, which a
 * 4-year-old can't solve but an adult answers in seconds.
 */
export function ParentGate({ open, onPass, onClose }: { open: boolean; onPass: () => void; onClose: () => void }) {
  const [seed, setSeed] = useState(0);
  const [wrong, setWrong] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const q = useMemo(makeQuestion, [seed, open]);
  const words = ["nol", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-labelledby="gate-title"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
            className="relative w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-2xl"
          >
            <button onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-full p-2 text-ink-soft hover:bg-foam">
              <X size={24} />
            </button>
            <Lock className="mx-auto mb-2 text-lilac-dark" size={36} />
            <h2 id="gate-title" className="text-2xl font-extrabold">Khusus Orang Tua</h2>
            <p className="mt-1 text-base text-ink-soft">Jawab pertanyaan ini untuk melanjutkan.</p>
            <p className="mt-4 font-display text-2xl font-extrabold">
              Berapa {words[q.a]} kali {words[q.b]}?
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {q.options.map((o) => (
                <button
                  key={o}
                  className="btn-chunky tone-sand min-h-14 rounded-2xl font-display text-2xl font-extrabold text-ink"
                  onClick={() => {
                    if (o === q.answer) { setWrong(false); onPass(); }
                    else { setWrong(true); setSeed((s) => s + 1); }
                  }}
                >
                  {o}
                </button>
              ))}
            </div>
            {wrong && <p className="mt-3 text-sm text-coral-dark">Belum tepat — ini pertanyaan baru.</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
