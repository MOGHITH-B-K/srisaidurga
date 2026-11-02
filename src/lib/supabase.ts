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
 * Robust Supabase synchronizer.
 * 1. Tries client-side direct upsert (snake_case + camelCase compatibility).
 * 2. Falls back to server-side /api/supabase/sync proxy if client-side is blocked by CORS/RLS.
 * 3. Logs descriptive success/failure notices.
 */
export async function syncToSupabase(table: string, payload: any): Promise<boolean> {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    (typeof window !== "undefined" ? localStorage.getItem("shop_supabase_url") : null);
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (typeof window !== "undefined" ? localStorage.getItem("shop_supabase_key") : null);

  if (!url || !anonKey) {
    console.info(`[Supabase Sync] Skipped table "${table}" because Supabase is not connected yet.`);
    return false;
  }

  try {
    // 1. Prepare record formatting (convert camelCase properties to snake_case for PostgreSQL)
    const cleanPayload = { ...payload };
    if (!cleanPayload.id || cleanPayload.id === 0) {
      delete cleanPayload.id;
    }

    const snakeRecord: Record<string, any> = {};
    for (const [key, val] of Object.entries(cleanPayload)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      snakeRecord[snakeKey] = val;
    }

    // Direct client attempt
    const supabase = getSupabaseClient();
    if (supabase) {
      const { error: snakeErr } = await supabase.from(table).upsert(snakeRecord);
      if (!snakeErr) {
        console.log(`[Supabase Sync] Successfully saved to table "${table}" (snake_case)`);
        return true;
      }

      // Try original keys
      const { error: origErr } = await supabase.from(table).upsert(cleanPayload);
      if (!origErr) {
        console.log(`[Supabase Sync] Successfully saved to table "${table}" (original keys)`);
        return true;
      }

      console.warn(`[Supabase Client Sync Notice] Direct upsert to "${table}" returned:`, snakeErr.message || origErr.message);
    }

    // 2. Server-side proxy sync fallback
    const res = await fetch("/api/supabase/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supabaseUrl: url,
        supabaseAnonKey: anonKey,
        table,
        payload: cleanPayload,
      }),
    });

    if (res.ok) {
      console.log(`[Supabase Sync] Server proxy successfully saved to table "${table}"`);
      return true;
    }

    const errJson = await res.json().catch(() => ({}));
    console.warn(`[Supabase Sync Proxy Notice] Table "${table}":`, errJson.error || res.statusText);
    return false;
  } catch (err: any) {
    console.warn(`[Supabase Sync Exception] Table "${table}":`, err.message || err);
    return false;
  }
}

/**
 * SQL script for creating tables in Supabase SQL editor with all required columns.
 */
export const SUPABASE_SQL_SCHEMA = `-- 1. SALES BILLS TABLE
CREATE TABLE IF NOT EXISTS public.sales_bills (
  id BIGSERIAL PRIMARY KEY,
  serial_no INTEGER,
  bill_date TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB,
  subtotal NUMERIC,
  tax_percentage NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  tax_type TEXT DEFAULT 'GST',
  advance_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  customer_feedback TEXT,
  shop_name TEXT,
  shop_address TEXT,
  shop_phone_1 TEXT,
  shop_phone_2 TEXT,
  shop_logo_url TEXT,
  shop_qr_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RENTAL BILLS TABLE
CREATE TABLE IF NOT EXISTS public.rental_bills (
  id BIGSERIAL PRIMARY KEY,
  serial_no INTEGER,
  from_date TEXT,
  to_date TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB,
  subtotal NUMERIC,
  transport_fees NUMERIC DEFAULT 0,
  tax_percentage NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  tax_type TEXT DEFAULT 'GST',
  advance_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  customer_feedback TEXT,
  shop_name TEXT,
  shop_address TEXT,
  shop_phone_1 TEXT,
  shop_phone_2 TEXT,
  shop_logo_url TEXT,
  shop_qr_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  product_type TEXT NOT NULL DEFAULT 'sales',
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 5,
  total_sales INTEGER DEFAULT 0,
  total_rentals INTEGER DEFAULT 0,
  last_restocked TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  photo_urls JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGSERIAL PRIMARY KEY,
  bill_type TEXT NOT NULL,
  bill_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  items JSONB,
  total_amount NUMERIC DEFAULT 0,
  booking_date TEXT,
  notes TEXT,
  status TEXT DEFAULT 'booked',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and permissive policy for public anon key operations
ALTER TABLE public.sales_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public all access on sales_bills" ON public.sales_bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all access on rental_bills" ON public.rental_bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all access on products" ON public.products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all access on customers" ON public.customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public all access on bookings" ON public.bookings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
`;
