import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function supabaseConfig() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!rawUrl || !key || rawUrl.includes("YOUR_PROJECT")) return null;
  // Strip any accidental /rest/v1 (or /rest/v1/) suffix — the SDK constructs
  // its own paths; a double-path like /rest/v1/rest/v1/... breaks all requests.
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "");
  return { url, key };
}

let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const cfg = supabaseConfig();
  cached = cfg
    ? createClient(cfg.url, cfg.key, {
        global: {
          // Explicitly set Authorization on every request — prevents 401 when
          // the SDK's internal header construction is delayed or cached stale.
          headers: { Authorization: `Bearer ${cfg.key}` },
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : null;
  return cached;
}
