"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthCtx { user: User | null; session: Session | null; loading: boolean; }
const AuthContext = createContext<AuthCtx>({ user: null, session: null, loading: true });

// Keys used by the old localStorage-based db.ts
const LOCAL_KEYS = ["gold_billing_customers", "gold_billing_bills"];

function clearLocalData() {
  if (typeof window !== "undefined") {
    LOCAL_KEYS.forEach(k => localStorage.removeItem(k));
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      // Clear stale localStorage whenever a session exists
      if (data.session?.user) clearLocalData();
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      // Clear old data when user signs in
      if (event === "SIGNED_IN") clearLocalData();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, session, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

