import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced clearly in the browser console / server logs if env vars are missing.
  // eslint-disable-next-line no-console
  console.warn(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example)."
  );
}

// Fall back to harmless placeholders so the module can be imported during the
// build / prerender step even when env vars are absent. Real values are inlined
// at build time (NEXT_PUBLIC_*) on Vercel and from .env.local locally.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

// ── Shared types ────────────────────────────────────────────────────────────

export type Player = {
  id: string;
  name: string;
  created_at: string;
};

export type FineType = {
  id: string;
  name: string;
  description: string;
  amount: number;
  sort_order: number;
};

export type Fine = {
  id: string;
  player_id: string;
  fine_type_id: string | null;
  round: string;
  amount: number;
  created_at: string;
};

export type Payment = {
  id: string;
  player_id: string;
  amount: number;
  note: string;
  created_at: string;
};
