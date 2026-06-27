import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "superadmin" | "doctor" | "user";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  /** Resolved role from DB. `null` while loading or signed out. */
  role: AppRole | null;
  isRoleLoading: boolean;
  /** Convenience: superadmin OR doctor (can access /admin). */
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isDoctor: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export async function resolveUserRole(userId: string): Promise<AppRole> {
  // Superadmin wins over doctor; doctor wins over plain user.
  const [{ data: superRow }, { data: doctorRow }] = await Promise.all([
    supabase.from("superadmins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("doctors").select("id").eq("user_id", userId).eq("is_active", true).maybeSingle(),
  ]);
  if (superRow) return "superadmin";
  if (doctorRow) return "doctor";
  return "user";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(false);

  const loadRole = (userId: string) => {
    setIsRoleLoading(true);
    resolveUserRole(userId)
      .then((r) => setRole(r))
      .catch(() => setRole("user"))
      .finally(() => setIsRoleLoading(false));
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Defer to avoid deadlocks per Supabase guidance.
        setTimeout(() => loadRole(session.user.id), 0);
      } else {
        setRole(null);
        setIsRoleLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    const redirectPath =
      sessionStorage.getItem("post_auth_redirect_path") || "/";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
    return { error: error as Error | null };
  };

  const isSuperAdmin = role === "superadmin";
  const isDoctor = role === "doctor";
  const isAdmin = isSuperAdmin || isDoctor;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        role,
        isRoleLoading,
        isAdmin,
        isSuperAdmin,
        isDoctor,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
