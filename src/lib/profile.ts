import { supabase } from "./supabase";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}

export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string,
): Promise<boolean> {
  if (!isValidUsername(username)) return false;

  let query = supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .limit(1);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("Username check failed:", error.message);
    return false;
  }

  return (data ?? []).length === 0;
}

export async function updateProfileFields(
  userId: string,
  fields: {
    fullName?: string;
    username?: string;
    avatarUrl?: string | null;
    mfaEnabled?: boolean;
    showPublicProfile?: boolean;
    showRating?: boolean;
    showHistory?: boolean;
  },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (fields.fullName !== undefined) payload.full_name = fields.fullName.trim();
  if (fields.username !== undefined) payload.username = fields.username.trim().toLowerCase();
  if (fields.avatarUrl !== undefined) payload.avatar_url = fields.avatarUrl;
  if (fields.mfaEnabled !== undefined) payload.mfa_enabled = fields.mfaEnabled;
  if (fields.showPublicProfile !== undefined) payload.show_public_profile = fields.showPublicProfile;
  if (fields.showRating !== undefined) payload.show_rating = fields.showRating;
  if (fields.showHistory !== undefined) payload.show_history = fields.showHistory;

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) throw new Error(error.message);
}

export type ProfilePrivacySettings = {
  showPublicProfile: boolean;
  showRating: boolean;
  showHistory: boolean;
  mfaEnabled: boolean;
};

export async function fetchProfilePrivacySettings(userId: string): Promise<ProfilePrivacySettings> {
  const { data, error } = await supabase
    .from("profiles")
    .select("show_public_profile, show_rating, show_history, mfa_enabled")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return {
    showPublicProfile: data?.show_public_profile ?? true,
    showRating: data?.show_rating ?? true,
    showHistory: data?.show_history ?? false,
    mfaEnabled: data?.mfa_enabled ?? false,
  };
}

export async function completeProfileSetup(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ profile_setup_completed_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Weak", color: "#EF4444" };
  if (score <= 3) return { score, label: "Fair", color: "#F59E0B" };
  if (score <= 4) return { score, label: "Good", color: "#06B6D4" };
  return { score, label: "Strong", color: "#10B981" };
}

export type PublicMemberProfile = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  hours_available: number;
  mfa_enabled: boolean;
  created_at: string;
};

export type MemberNameFields = Pick<PublicMemberProfile, "full_name" | "username">;

export function getMemberDisplayName(profile: MemberNameFields | null | undefined): string {
  if (profile?.username) return profile.username;
  const fullName = profile?.full_name?.trim();
  if (fullName) return fullName;
  return "Member";
}

export function formatMemberLabel(profile: MemberNameFields | null | undefined): string {
  if (profile?.username) return `@${profile.username}`;
  return getMemberDisplayName(profile);
}

const PUBLIC_PROFILE_SELECT =
  "id, full_name, username, avatar_url, city, state, country, hours_available, mfa_enabled, created_at";

export async function fetchPublicProfile(userId: string): Promise<PublicMemberProfile | null> {
  const { data, error } = await supabase
    .from("member_profiles")
    .select(PUBLIC_PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicMemberProfile | null;
}

export function formatPublicLocation(profile: Pick<PublicMemberProfile, "city" | "state" | "country">): string {
  const parts = [
    profile.city,
    profile.state,
    profile.country && profile.country !== "US" ? profile.country : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location not shared";
}
