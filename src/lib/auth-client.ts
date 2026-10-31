"use client";

import { createAuthClient } from "better-auth/react";
import { useEffect, useState } from "react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("bearer_token") || "" : ""}`,
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken) {
        const tokenPart = authToken.includes(".") ? authToken.split(".")[0] : authToken;
        localStorage.setItem("bearer_token", tokenPart);
      }
    },
  },
});

type SessionData = ReturnType<typeof authClient.useSession>;

export function useSession(): SessionData {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<any>(null);

  const refetch = () => {
    setIsPending(true);
    setError(null);
    fetchSession();
  };

  const fetchSession = async () => {
    try {
      // 1. Try Better-Auth session first
      const res = await authClient.getSession({
        fetchOptions: {
          auth: {
            type: "Bearer",
            token: typeof window !== "undefined" ? localStorage.getItem("bearer_token") || "" : "",
          },
        },
      });

      if (res.data) {
        setSession(res.data);
        setError(null);
        return;
      }

      // 2. Fallback to local admin session if logged in as admin
      if (typeof window !== "undefined") {
        const adminUserStr = localStorage.getItem("shop_current_user");
        const adminToken = localStorage.getItem("shop_auth_token");
        if (adminUserStr && adminToken) {
          try {
            const adminUser = JSON.parse(adminUserStr);
            setSession({
              user: {
                id: adminUser.id || "1",
                name: adminUser.name || adminUser.username || "Admin",
                email: adminUser.email || `${adminUser.username?.toLowerCase()}@shop.local`,
              },
              session: {
                id: adminToken,
                token: adminToken,
              },
            });
            setError(null);
            return;
          } catch {
            // ignore JSON error
          }
        }
      }

      setSession(null);
      setError(null);
    } catch (err) {
      // Check fallback on error
      if (typeof window !== "undefined") {
        const adminUserStr = localStorage.getItem("shop_current_user");
        if (adminUserStr) {
          try {
            const adminUser = JSON.parse(adminUserStr);
            setSession({
              user: {
                id: adminUser.id || "1",
                name: adminUser.name || adminUser.username || "Admin",
                email: adminUser.email || `${adminUser.username?.toLowerCase()}@shop.local`,
              },
            });
            setError(null);
            return;
          } catch {
            // ignore
          }
        }
      }
      setSession(null);
      setError(err);
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { data: session, isPending, error, refetch } as any;
}