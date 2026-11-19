"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both public Supabase env vars are set. Otherwise the app runs in demo mode. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

/**
 * Browser client using the PUBLIC anon key only. All data access is protected by
 * Row Level Security (see supabase/migrations). The service-role key is never used here.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase belum dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).");
  if (!client) client = createBrowserClient(url, anonKey);
  return client;
}
