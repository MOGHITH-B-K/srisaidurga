import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  secret: process.env.BETTER_AUTH_SECRET || "default_super_secret_better_auth_key_123456789",
  baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [bearer()],
});

// Session validation helper
export async function getCurrentUser(request?: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user || null;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
