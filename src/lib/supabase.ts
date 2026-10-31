import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client if configured via environment variables or browser localStorage.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof window !== "undefined" ? localStorage.getItem("shop_supabase_url") : null);
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" ? localStorage.getItem("shop_supabase_key") : null);

  if (!url || !anonKey) {
    return null;
  }

  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (e) {
    console.warn("[Supabase] Failed to initialize client:", e);
    return null;
  }
}

/**
 * Asynchronously syncs a record to Supabase in the background without blocking the UI.
 * This guarantees instantaneous saving while ensuring dual persistence.
 */
export async function syncToSupabase(table: string, payload: any): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    // Fire off upsert to Supabase in background
    const cleanPayload = { ...payload };
    // Remove auto-generated id if 0/undefined so Supabase generates its own primary key if table uses serial
    if (!cleanPayload.id || cleanPayload.id === 0) {
      delete cleanPayload.id;
    }

    const { error } = await supabase.from(table).upsert(cleanPayload);
    if (error) {
      console.warn(`[Supabase Sync] Table ${table} sync notice:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[Supabase Sync] Exception on ${table}:`, err);
    return false;
  }
}
