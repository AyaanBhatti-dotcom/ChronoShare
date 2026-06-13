import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";
import type { Profile } from "../../types/database";

export interface Session {
  userId: string;
  name: string;
  email: string;
  hoursAvailable: number;
  onboardingCompleted: boolean;
}

interface AuthContextValue {
  user: Session | null;
  isLoading: boolean;
  isPreview: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export { getInitials };

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  return message;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Could not load profile:", error.message);
    return null;
  }

  return data;
}

function toSession(authUser: SupabaseUser, profile: Profile | null): Session {
  const name =
    profile?.full_name ||
    (authUser.user_metadata?.full_name as string | undefined) ||
    authUser.email?.split("@")[0] ||
    "User";

  return {
    userId: authUser.id,
    name,
    email: authUser.email ?? profile?.email ?? "",
    hoursAvailable: profile?.hours_available ?? 1.0,
    onboardingCompleted: profile?.onboarding_completed_at != null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolveSession = useCallback(async (authUser: SupabaseUser | null) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    const profile = await fetchProfile(authUser.id);
    setUser(toSession(authUser, profile));
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        resolveSession(session.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        resolveSession(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [resolveSession]);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return mapAuthError(error.message);
    if (!data.user) return "Sign in failed. Please try again.";

    await resolveSession(data.user);
    return null;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<string | null> => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) return "Name is required.";
    if (!normalizedEmail) return "Email is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: trimmedName },
      },
    });

    if (error) return mapAuthError(error.message);
    if (!data.user) return "Sign up failed. Please try again.";

    // Fallback if DB trigger hasn't been applied yet
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: trimmedName,
      email: normalizedEmail,
    });

    if (!data.session) {
      return "Check your email to confirm your account, then sign in.";
    }

    await resolveSession(data.user);
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<string | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return "Email is required.";

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) return mapAuthError(error.message);
    return null;
  };

  const updatePassword = async (password: string): Promise<string | null> => {
    if (password.length < 6) return "Password must be at least 6 characters.";

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return mapAuthError(error.message);
    return null;
  };

  const completeOnboarding = async (): Promise<string | null> => {
    if (!user) return "Not signed in.";

    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.userId);

    if (error) return error.message;

    setUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : null));
    return null;
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await resolveSession(session.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isPreview: false,
        login,
        signup,
        resetPassword,
        updatePassword,
        logout,
        completeOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthPreviewProvider({
  user,
  children,
}: {
  user: Session;
  children: ReactNode;
}) {
  const noop = async (): Promise<string | null> => "Not available in preview mode.";

  return (
    <AuthContext.Provider
      value={{
        user: { ...user, onboardingCompleted: true },
        isLoading: false,
        isPreview: true,
        login: noop,
        signup: noop,
        resetPassword: noop,
        updatePassword: noop,
        logout: async () => {},
        completeOnboarding: noop,
        refreshUser: async () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
