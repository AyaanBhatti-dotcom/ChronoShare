import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { signupEmailRedirectUrl, supabase } from "../../lib/supabase";
import { validatePasswordNotLeaked } from "../../lib/password-leak-check";
import { completeProfileSetup as markProfileSetupDone } from "../../lib/profile";
import type { Profile } from "../../types/database";
import {
  markOnboardingDoneLocal,
  isOnboardingDoneLocal,
  clearOnboardingDoneLocal,
} from "../utils/onboarding";

export interface Session {
  userId: string;
  name: string;
  username: string | null;
  email: string;
  avatarUrl: string | null;
  hoursAvailable: number;
  profileSetupCompleted: boolean;
  onboardingCompleted: boolean;
}

interface SignupInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface SignupResult {
  error: string | null;
  needsEmailVerification: boolean;
}

interface AuthContextValue {
  user: Session | null;
  isLoading: boolean;
  isPreview: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (input: SignupInput) => Promise<SignupResult>;
  signInAfterEmailConfirmation: (email: string, password: string) => Promise<string | null>;
  resendSignupEmail: (email: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  finishProfileSetup: () => Promise<string | null>;
  completeOnboarding: () => Promise<string | null>;
  resetOnboarding: () => Promise<string | null>;
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
    return "Click the confirmation link in your email first, then try again.";
  }
  if (lower.includes("token has expired") || lower.includes("invalid otp")) {
    return "That confirmation link has expired. Request a new one.";
  }
  if (lower.includes("rate limit") || lower.includes("over_email_send")) {
    return "Too many emails sent. Wait a few minutes, then try again.";
  }
  if (lower.includes("duplicate key") || lower.includes("profiles_username")) {
    return "That username is already taken.";
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
    username: profile?.username ?? null,
    email: authUser.email ?? profile?.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    hoursAvailable: profile?.hours_available ?? 1.0,
    profileSetupCompleted: profile?.profile_setup_completed_at != null,
    onboardingCompleted:
      profile?.onboarding_completed_at != null || isOnboardingDoneLocal(authUser.id),
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

  const signup = async (input: SignupInput): Promise<SignupResult> => {
    const trimmedName = input.name.trim();
    const normalizedUsername = input.username.trim().toLowerCase();
    const normalizedEmail = input.email.trim().toLowerCase();

    if (!trimmedName) return { error: "Name is required.", needsEmailVerification: false };
    if (!normalizedUsername) return { error: "Username is required.", needsEmailVerification: false };
    if (!normalizedEmail) return { error: "Email is required.", needsEmailVerification: false };
    if (input.password.length < 6) {
      return { error: "Password must be at least 6 characters.", needsEmailVerification: false };
    }

    const leakedPasswordError = await validatePasswordNotLeaked(input.password);
    if (leakedPasswordError) {
      return { error: leakedPasswordError, needsEmailVerification: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: input.password,
      options: {
        data: { full_name: trimmedName, username: normalizedUsername },
        emailRedirectTo: signupEmailRedirectUrl(),
      },
    });

    if (error) return { error: mapAuthError(error.message), needsEmailVerification: false };
    if (!data.user) return { error: "Sign up failed. Please try again.", needsEmailVerification: false };

    const isExistingAccount = (data.user.identities?.length ?? 0) === 0;
    if (isExistingAccount) {
      const signIn = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: input.password,
      });

      if (!signIn.error && signIn.data.user) {
        await supabase.from("profiles").upsert({
          id: signIn.data.user.id,
          full_name: trimmedName,
          email: normalizedEmail,
          username: normalizedUsername,
        });
        await resolveSession(signIn.data.user);
        return { error: null, needsEmailVerification: false };
      }

      if (signIn.error?.message.toLowerCase().includes("email not confirmed")) {
        return { error: null, needsEmailVerification: true };
      }

      return {
        error:
          "This email is already registered. Sign in from the login page, or reset your password if you forgot it.",
        needsEmailVerification: false,
      };
    }

    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: trimmedName,
      email: normalizedEmail,
      username: normalizedUsername,
    });

    if (!data.session) {
      return { error: null, needsEmailVerification: true };
    }

    await resolveSession(data.user);
    return { error: null, needsEmailVerification: false };
  };

  const signInAfterEmailConfirmation = async (
    email: string,
    password: string,
  ): Promise<string | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return "Email is required.";
    if (password.length < 6) return "Password is required.";

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      await resolveSession(sessionData.session.user);
      return null;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) return mapAuthError(error.message);
    if (!data.user) return "Sign in failed. Please try again.";

    await resolveSession(data.user);
    return null;
  };

  const resendSignupEmail = async (email: string): Promise<string | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return "Email is required.";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizedEmail,
      options: {
        emailRedirectTo: signupEmailRedirectUrl(),
      },
    });

    if (error) return mapAuthError(error.message);
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

    const leakedPasswordError = await validatePasswordNotLeaked(password);
    if (leakedPasswordError) return leakedPasswordError;

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return mapAuthError(error.message);
    return null;
  };

  const finishProfileSetup = useCallback(async (): Promise<string | null> => {
    if (!user) return "Not signed in.";

    try {
      await markProfileSetupDone(user.userId);
    } catch (err) {
      return err instanceof Error ? err.message : "Could not finish setup.";
    }

    setUser((prev) => (prev ? { ...prev, profileSetupCompleted: true } : null));
    return null;
  }, [user]);

  const completeOnboarding = useCallback(async (): Promise<string | null> => {
    if (!user) return "Not signed in.";

    const { data, error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.userId)
      .select("id")
      .maybeSingle();

    if (error) return error.message;
    if (!data) return "Could not save onboarding progress. Please try again.";

    markOnboardingDoneLocal(user.userId);
    setUser((prev) => (prev ? { ...prev, onboardingCompleted: true } : null));
    return null;
  }, [user]);

  const resetOnboarding = useCallback(async (): Promise<string | null> => {
    if (!user) return "Not signed in.";

    const { data, error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: null })
      .eq("id", user.userId)
      .select("id")
      .maybeSingle();

    if (error) return error.message;
    if (!data) return "Could not reset onboarding. Please try again.";

    clearOnboardingDoneLocal();
    setUser((prev) => (prev ? { ...prev, onboardingCompleted: false } : null));
    return null;
  }, [user]);

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
        signInAfterEmailConfirmation,
        resendSignupEmail,
        resetPassword,
        updatePassword,
        logout,
        finishProfileSetup,
        completeOnboarding,
        resetOnboarding,
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

  const previewSignup = async (): Promise<SignupResult> => ({
    error: "Not available in preview mode.",
    needsEmailVerification: false,
  });

  return (
    <AuthContext.Provider
      value={{
        user: { ...user, profileSetupCompleted: true, onboardingCompleted: true },
        isLoading: false,
        isPreview: true,
        login: noop,
        signup: previewSignup,
        signInAfterEmailConfirmation: noop,
        resendSignupEmail: noop,
        resetPassword: noop,
        updatePassword: noop,
        logout: async () => {},
        finishProfileSetup: noop,
        completeOnboarding: noop,
        resetOnboarding: noop,
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
