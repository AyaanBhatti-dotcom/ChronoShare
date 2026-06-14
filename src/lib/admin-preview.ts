import { supabase } from "./supabase";
import { enrichPostsWithDistance, type NearbyPost, type UserLocation } from "./location";
import type { ExchangeWithProfiles, PostWithAuthor } from "../types/database";
import type { Session } from "../app/context/AuthContext";

export interface AdminUserPreviewData {
  id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  hours_available: number;
  city: string | null;
  region: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  profile_setup_completed: boolean;
  onboarding_completed: boolean;
  pending_count: number;
  needs_confirm_count: number;
  recent_exchanges: ExchangeWithProfiles[];
  active_posts: NearbyPost[];
  location: UserLocation | null;
}

function parseLocation(raw: Record<string, unknown>): UserLocation | null {
  const latitude = raw.latitude as number | null;
  const longitude = raw.longitude as number | null;
  if (latitude == null || longitude == null) return null;

  return {
    city: (raw.city as string | null) ?? null,
    region: (raw.region as string | null) ?? null,
    state: (raw.state as string | null) ?? null,
    country: (raw.country as string | null) ?? null,
    latitude,
    longitude,
  };
}

function toSession(data: AdminUserPreviewData): Session {
  const displayName =
    data.username?.trim() ||
    data.full_name?.trim() ||
    data.email?.split("@")[0] ||
    "User";

  return {
    userId: data.id,
    name: displayName,
    username: data.username,
    email: data.email ?? "",
    avatarUrl: data.avatar_url,
    hoursAvailable: Number(data.hours_available) || 0,
    profileSetupCompleted: data.profile_setup_completed,
    onboardingCompleted: data.onboarding_completed,
  };
}

export async function fetchAdminUserPreview(
  adminKey: string,
  userId: string,
): Promise<{ session: Session; snapshot: AdminUserPreviewData }> {
  const { data, error } = await supabase.rpc("admin_get_user_preview", {
    p_key: adminKey,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object") throw new Error("Preview data unavailable.");

  const raw = data as Record<string, unknown>;
  const location = parseLocation(raw);
  const activePostsRaw = (raw.active_posts as PostWithAuthor[] | null) ?? [];
  const activePosts = location
    ? enrichPostsWithDistance(activePostsRaw, location)
    : activePostsRaw.map((post) => ({
        ...post,
        distanceMiles: null,
        matchType: "unknown" as const,
      }));

  const snapshot: AdminUserPreviewData = {
    id: raw.id as string,
    full_name: (raw.full_name as string | null) ?? null,
    username: (raw.username as string | null) ?? null,
    email: (raw.email as string | null) ?? null,
    avatar_url: (raw.avatar_url as string | null) ?? null,
    hours_available: Number(raw.hours_available) || 0,
    city: (raw.city as string | null) ?? null,
    region: (raw.region as string | null) ?? null,
    state: (raw.state as string | null) ?? null,
    country: (raw.country as string | null) ?? null,
    latitude: (raw.latitude as number | null) ?? null,
    longitude: (raw.longitude as number | null) ?? null,
    profile_setup_completed: Boolean(raw.profile_setup_completed),
    onboarding_completed: Boolean(raw.onboarding_completed),
    pending_count: Number(raw.pending_count) || 0,
    needs_confirm_count: Number(raw.needs_confirm_count) || 0,
    recent_exchanges: (raw.recent_exchanges as ExchangeWithProfiles[] | null) ?? [],
    active_posts: activePosts,
    location,
  };

  return {
    session: toSession(snapshot),
    snapshot,
  };
}

export const SAMPLE_PREVIEW: { session: Session; snapshot: AdminUserPreviewData } = {
  session: {
    userId: "00000000-0000-0000-0000-000000000000",
    name: "sample_user",
    username: "sample_user",
    email: "sample@chronoshare.app",
    avatarUrl: null,
    hoursAvailable: 1.0,
    profileSetupCompleted: true,
    onboardingCompleted: true,
  },
  snapshot: {
    id: "00000000-0000-0000-0000-000000000000",
    full_name: "Sample User",
    username: "sample_user",
    email: "sample@chronoshare.app",
    avatar_url: null,
    hours_available: 1.0,
    city: "London",
    region: null,
    state: null,
    country: "GB",
    latitude: 51.5074,
    longitude: -0.1278,
    profile_setup_completed: true,
    onboarding_completed: true,
    pending_count: 0,
    needs_confirm_count: 0,
    recent_exchanges: [],
    active_posts: [],
    location: {
      city: "London",
      region: null,
      state: null,
      country: "GB",
      latitude: 51.5074,
      longitude: -0.1278,
    },
  },
};
