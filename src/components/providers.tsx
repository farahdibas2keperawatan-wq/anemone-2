"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { LearningModule } from "@/content/types";
import { CURRICULUM } from "@/content/curriculum";
import { loadCurriculum } from "@/lib/curriculum-source";
import { getStore } from "@/lib/store";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Child, ChildData } from "@/lib/types";
import { audio } from "@/lib/audio";

const ACTIVE_KEY = "anemone:activeChild";
export const BREAK_AFTER_SECONDS = 10 * 60; // gentle break suggestion after 10 minutes

interface AppState {
  mode: "demo" | "cloud";
  ready: boolean;
  error: string | null;
  modules: LearningModule[];
  contentSource: "database" | "bundled";
  authSession: Session | null;
  children: Child[];
  activeChild: Child | null;
  childData: ChildData | null;
  sessionSeconds: number;
  selectChild: (id: string | null) => void;
  refreshChildren: () => Promise<void>;
  refreshChildData: () => Promise<ChildData | null>;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
};

export function AppProvider({ children: ui }: { children: ReactNode }) {
  const cloud = isSupabaseConfigured();
  const store = getStore();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<LearningModule[]>(CURRICULUM);
  const [contentSource, setSource] = useState<"database" | "bundled">("bundled");
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [kids, setKids] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const sessionRef = useRef<{ id: string; start: number } | null>(null);

  // Unlock audio on the first tap anywhere.
  useEffect(() => {
    const h = () => audio.unlock();
    window.addEventListener("pointerdown", h, { once: true });
    return () => window.removeEventListener("pointerdown", h);
  }, []);

  const refreshChildren = useCallback(async () => {
    try {
      setKids(await store.listChildren());
    } catch (e) {
      setError((e as Error).message);
    }
  }, [store]);

  // Boot: auth (cloud), curriculum, children, remembered active child.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        if (cloud) {
          const sb = getSupabase();
          const { data } = await sb.auth.getSession();
          setAuthSession(data.session);
          unsub = sb.auth.onAuthStateChange((_e, s) => setAuthSession(s)).data.subscription.unsubscribe;
        }
        const c = await loadCurriculum();
        setModules(c.modules);
        setSource(c.source);
        setActiveId(localStorage.getItem(ACTIVE_KEY));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setReady(true);
      }
    })();
    return () => unsub?.();
  }, [cloud]);

  // (Re)load children whenever auth changes.
  useEffect(() => {
    if (!ready) return;
    if (cloud && !authSession) { setKids([]); return; }
    refreshChildren();
  }, [ready, cloud, authSession, refreshChildren]);

  const activeChild = kids.find((k) => k.id === activeId) ?? null;

  const refreshChildData = useCallback(async () => {
    if (!activeChild) { setChildData(null); return null; }
    try {
      const d = await store.getChildData(activeChild.id);
      setChildData(d);
      return d;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [activeChild, store]);

  useEffect(() => { refreshChildData(); }, [refreshChildData]);

  // Learning session tracking (records duration; heartbeat survives tab close).
  const activeChildId = activeChild?.id;
  useEffect(() => {
    if (!activeChildId) return;
    let cancelled = false;
    let lastBeat = 0;
    store.startSession(activeChildId).then((id) => {
      if (!cancelled) sessionRef.current = { id, start: Date.now() };
    }).catch(() => {});
    setSessionSeconds(0);
    const beat = () => {
      const s = sessionRef.current;
      if (!s) return;
      const secs = Math.round((Date.now() - s.start) / 1000);
      setSessionSeconds(secs);
      if (secs - lastBeat >= 20) { lastBeat = secs; store.touchSession(s.id, secs).catch(() => {}); }
    };
    const iv = setInterval(beat, 5000);
    const onHide = () => {
      const s = sessionRef.current;
      if (s) store.touchSession(s.id, Math.round((Date.now() - s.start) / 1000)).catch(() => {});
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      cancelled = true;
      onHide();
      sessionRef.current = null;
      clearInterval(iv);
      window.removeEventListener("pagehide", onHide);
    };
  }, [activeChildId, store]);

  const selectChild = useCallback((id: string | null) => {
    setActiveId(id);
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  }, []);

  return (
    <Ctx.Provider
      value={{
        mode: store.mode, ready, error, modules, contentSource, authSession,
        children: kids, activeChild, childData, sessionSeconds,
        selectChild, refreshChildren, refreshChildData,
      }}
    >
      {ui}
    </Ctx.Provider>
  );
}
