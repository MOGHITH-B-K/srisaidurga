"use client";

import { useEffect, useState } from "react";

export interface UserSession {
  user: {
    id: number | string;
    username: string;
    name: string;
  } | null;
  token: string | null;
}

export function useSession() {
  const [session, setSession] = useState<UserSession>({ user: null, token: null });
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem("shop_auth_token");
      const userStr = localStorage.getItem("shop_current_user");
      if (token && userStr) {
        setSession({
          token,
          user: JSON.parse(userStr),
        });
      } else {
        setSession({ user: null, token: null });
      }
    } catch {
      setSession({ user: null, token: null });
    } finally {
      setIsPending(false);
    }
  }, []);

  return {
    data: session,
    isPending,
    error: null,
  };
}