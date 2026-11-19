"use client";
import { motion, AnimatePresence } from "framer-motion";

type Mood = "happy" | "cheer" | "think" | "sleepy";

/**
 * "Anemone" — the original mascot: a friendly coral-pink sea anemone with
 * swaying tentacles. Pure SVG so it scales crisply and needs no assets.
 */
export function Mascot({ size = 140, mood = "happy", say, bubbleAlign = "center" }: { size?: number; mood?: Mood; say?: string; bubbleAlign?: "center" | "left" }) {
  const tentacles = [-56, -34, -12, 12, 34, 56];
  const colors = ["#ff9db0", "#ffb36b", "#ff8a7a", "#b9a2ff", "#ffcd4d", "#7fe0cf"];
  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <AnimatePresence mode="wait">
        {say && (
          <motion.div
            key={say}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className={`absolute bottom-full mb-2 w-max max-w-[260px] ${bubbleAlign === "left" ? "left-0" : ""} rounded-3xl bg-white px-4 py-2 text-center font-display text-lg leading-snug text-ink shadow-lg`}
          >
            {say}
            <span className={`absolute -bottom-2 h-4 w-4 rotate-45 bg-white ${bubbleAlign === "left" ? "left-8" : "left-1/2 -translate-x-1/2"}`} />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        aria-label="Anemone"
        role="img"
        animate={mood === "cheer" ? { y: [0, -14, 0], rotate: [0, -4, 4, 0] } : { y: [0, -4, 0] }}
        transition={{ duration: mood === "cheer" ? 0.7 : 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* tentacles */}
        {tentacles.map((deg, i) => (
          <motion.g
            key={i}
            style={{ originX: 0.5, originY: 1 }}
            animate={{ rotate: [deg - 4, deg + 4, deg - 4] }}
            transition={{ duration: 2.4 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M100 110 C 92 80, 108 60, 100 30" stroke={colors[i]} strokeWidth="16" strokeLinecap="round" fill="none" />
            <circle cx="100" cy="28" r="10" fill={colors[i]} />
            <circle cx="97" cy="25" r="3" fill="#fff" opacity="0.7" />
          </motion.g>
        ))}
        {/* body */}
        <ellipse cx="100" cy="185" rx="58" ry="8" fill="#1d3557" opacity="0.08" />
        <path d="M48 120 Q 50 90 100 92 Q 150 90 152 120 L 146 172 Q 100 190 54 172 Z" fill="#ff8a7a" />
        <path d="M58 128 Q 100 140 142 128" stroke="#ffb3a7" strokeWidth="6" fill="none" strokeLinecap="round" />
        {/* cheeks */}
        <circle cx="70" cy="150" r="8" fill="#ff5f7e" opacity="0.35" />
        <circle cx="130" cy="150" r="8" fill="#ff5f7e" opacity="0.35" />
        {/* eyes */}
        {mood === "sleepy" ? (
          <>
            <path d="M74 140 q8 6 16 0" stroke="#1d3557" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M110 140 q8 6 16 0" stroke="#1d3557" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="82" cy="138" rx="9" ry="11" fill="#1d3557" />
            <ellipse cx="118" cy="138" rx="9" ry="11" fill="#1d3557" />
            <circle cx="85" cy="134" r="3.5" fill="#fff" />
            <circle cx="121" cy="134" r="3.5" fill="#fff" />
          </>
        )}
        {/* mouth */}
        {mood === "think" ? (
          <circle cx="100" cy="160" r="5" fill="#1d3557" />
        ) : (
          <path d={mood === "cheer" ? "M86 154 Q100 174 114 154 Z" : "M88 156 Q100 168 112 156"} stroke="#1d3557" strokeWidth="4" fill={mood === "cheer" ? "#c2405a" : "none"} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </motion.svg>
    </div>
  );
}
