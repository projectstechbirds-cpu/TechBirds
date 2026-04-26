import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserPublic } from "@techbirds/sdk";
import { ApiError } from "@techbirds/sdk";
import { api } from "@/lib/api";

interface AuthState {
  user: UserPublic | null;
  loading: boolean;
  requestOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, code: string) => Promise<UserPublic>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Try one silent refresh in case the access cookie just expired.
        try {
          await api.refreshSession();
          const me = await api.me();
          setUser(me);
          return;
        } catch {
          // fall through
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      requestOtp: async (email) => {
        await api.requestOtp(email);
      },
      verifyOtp: async (email, code) => {
        const res = await api.verifyOtp(email, code);
        setUser(res.user);
        return res.user;
      },
      refresh: fetchMe,
      logout: async () => {
        try {
          await api.logout();
        } finally {
          setUser(null);
        }
      },
    }),
    [user, loading, fetchMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
