import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseUrl, supabaseAnonKey } = body;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Supabase URL and Anon/Service Key are required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid Supabase Project URL format" },
        { status: 400 }
      );
    }

    // Attempt ping to Supabase REST / Auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Test request to health or users
    const { data, error } = await supabase.auth.getSession();

    if (error && !error.message?.includes("session")) {
      return NextResponse.json(
        { success: false, error: `Supabase connection failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase project!",
      url: supabaseUrl,
    });
  } catch (error: any) {
    console.error("Supabase test error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reach Supabase" },
      { status: 500 }
    );
  }
}
