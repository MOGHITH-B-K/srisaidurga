import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/db";
import { salesBills, rentalBills, products, customers, bookings } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseUrl, supabaseAnonKey, table, payload } = body;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Supabase URL and API Key are required" },
        { status: 400 }
      );
    }

    if (!table || !payload) {
      return NextResponse.json(
        { success: false, error: "Target table and payload are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Clean payload for Postgres naming & types
    const record = { ...payload };
    if (!record.id || record.id === 0) {
      delete record.id;
    }

    // Convert camelCase keys to snake_case if table uses Postgres conventions
    const formattedRecord: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      formattedRecord[snakeKey] = value;
    }

    // Try upserting with snake_case first, fallback to exact keys
    let { data, error } = await supabase.from(table).upsert(formattedRecord).select();

    if (error) {
      // Fallback try with original payload keys
      const retryResult = await supabase.from(table).upsert(record).select();
      if (retryResult.error) {
        return NextResponse.json({
          success: false,
          error: retryResult.error.message,
          code: retryResult.error.code,
          details: retryResult.error.details,
          hint: retryResult.error.hint,
        }, { status: 400 });
      }
      data = retryResult.data;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced record to Supabase table "${table}"`,
      data,
    });
  } catch (error: any) {
    console.error("Supabase sync API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sync to Supabase" },
      { status: 500 }
    );
  }
}

// Bulk sync endpoint to push all existing local data into Supabase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supabaseUrl = searchParams.get("url");
    const supabaseAnonKey = searchParams.get("key");

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Missing Supabase URL or Key in query params" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [allSales, allRentals, allProducts, allCustomers, allBookings] = await Promise.all([
      db.select().from(salesBills),
      db.select().from(rentalBills),
      db.select().from(products),
      db.select().from(customers),
      db.select().from(bookings),
    ]);

    const results: Record<string, { count: number; error?: string }> = {};

    // Helper for syncing array
    const syncTable = async (tableName: string, rows: any[]) => {
      if (rows.length === 0) {
        results[tableName] = { count: 0 };
        return;
      }
      const formattedRows = rows.map((r) => {
        const item: Record<string, any> = {};
        for (const [k, v] of Object.entries(r)) {
          const snake = k.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          item[snake] = v;
        }
        return item;
      });

      const { error } = await supabase.from(tableName).upsert(formattedRows);
      if (error) {
        // Try raw keys
        const rawRes = await supabase.from(tableName).upsert(rows);
        if (rawRes.error) {
          results[tableName] = { count: 0, error: rawRes.error.message };
          return;
        }
      }
      results[tableName] = { count: rows.length };
    };

    await syncTable("sales_bills", allSales);
    await syncTable("rental_bills", allRentals);
    await syncTable("products", allProducts);
    await syncTable("customers", allCustomers);
    await syncTable("bookings", allBookings);

    return NextResponse.json({
      success: true,
      message: "Sync complete",
      results,
    });
  } catch (error: any) {
    console.error("Supabase bulk sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed bulk sync" },
      { status: 500 }
    );
  }
}
