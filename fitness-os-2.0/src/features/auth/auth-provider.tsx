"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { isAuthRetryableFetchError, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { wasIntentionalSignOut } from "./signout";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  client: SupabaseClient | null;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createBrowserSupabaseClient);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const request = useRef(0);
  const mounted = useRef(true);
  const expiresAt = useRef<number | null>(null);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifiedUser = useRef<User | null>(null);

  const replaceUser = useCallback((nextUser: User | null, reason: "signed-out" | "expired" | "account-changed") => {
    const previousUserId = verifiedUser.current?.id;
    if (previousUserId && previousUserId !== nextUser?.id) {
      window.dispatchEvent(new CustomEvent("fitness-os-auth-change", {
        detail: { previousUserId, nextUserId: nextUser?.id ?? null, reason },
      }));
    }
    verifiedUser.current = nextUser;
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const id = ++request.current;
    try {
      const result = await client?.auth.getUser();
      let nextUser = result?.error ? null : (result?.data.user ?? null);
      let transient = Boolean(result?.error && isAuthRetryableFetchError(result.error));
      if (nextUser && client) {
        // Auth can still recognize a non-expired JWT after global sign-out.
        // The database independently checks that its auth.sessions row exists.
        const session = await client.rpc("has_current_auth_session");
        if (session.error || session.data !== true) {
          transient = Boolean(session.error && (session.status === 0 || session.status === 429 || session.status >= 500));
          nextUser = null;
        }
      }
      if (mounted.current && id === request.current) {
        // A previously verified user may keep editing their scoped outbox while
        // offline, until the known session expires. Servers still revalidate.
        if (!transient || !expiresAt.current || Date.now() >= expiresAt.current) {
          replaceUser(nextUser, nextUser ? "account-changed" : "expired");
        }
      }
    } catch (error) {
      const transient = error instanceof TypeError || isAuthRetryableFetchError(error);
      if (mounted.current && id === request.current && (!transient || !expiresAt.current || Date.now() >= expiresAt.current)) replaceUser(null, "expired");
    } finally {
      if (mounted.current && id === request.current) setLoading(false);
    }
  }, [client, replaceUser]);

  useEffect(() => {
    mounted.current = true;
    if (!client) return;
    queueMicrotask(() => { if (mounted.current) void refreshUser(); });
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      expiresAt.current = session?.expires_at ? session.expires_at * 1000 : null;
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      if (expiresAt.current) {
        expiryTimer.current = setTimeout(() => { if (mounted.current) void refreshUser(); }, Math.max(0, expiresAt.current - Date.now() + 100));
      }
      if (event === "SIGNED_OUT") {
        request.current += 1;
        const previousUserId = verifiedUser.current?.id;
        replaceUser(null, previousUserId && wasIntentionalSignOut(previousUserId) ? "signed-out" : "expired");
        setLoading(false);
      } else {
        // Leave the SDK auth lock before performing another auth request.
        queueMicrotask(() => { if (mounted.current) void refreshUser(); });
      }
    });
    return () => { mounted.current = false; request.current += 1; subscription.unsubscribe(); if (expiryTimer.current) clearTimeout(expiryTimer.current); };
  }, [client, refreshUser, replaceUser]);

  return <AuthContext.Provider value={{ user, loading, configured: Boolean(client), client, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
