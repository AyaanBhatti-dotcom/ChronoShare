import { supabase } from "./supabase";
import type { PostWithAuthor } from "../types/database";
import { getStateName } from "./us-states";

export interface UserLocation {
  city: string | null;
  region: string | null;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface NearbyPost extends PostWithAuthor {
  distanceMiles: number | null;
  matchType: "distance" | "state" | "unknown";
}

const EARTH_RADIUS_MILES = 3959;

export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(miles: number | null): string {
  if (miles == null) return "Nearby";
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

export function formatLocationLabel(location: UserLocation): string {
  const parts = [location.city, location.state ?? location.region].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Your area";
}

/** Detect approximate location from the visitor's public IP (no API key required). */
export async function detectLocationFromIp(): Promise<UserLocation | null> {
  try {
    const res = await fetch("https://ipwho.is/");
    if (!res.ok) return null;

    const data = (await res.json()) as {
      success?: boolean;
      city?: string;
      region?: string;
      region_code?: string;
      country_code?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!data.success || data.latitude == null || data.longitude == null) {
      return null;
    }

    return {
      city: data.city ?? null,
      region: data.region ?? null,
      state: data.region_code ?? data.region ?? null,
      country: data.country_code ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch {
    return null;
  }
}

export async function fetchSavedUserLocation(userId: string): Promise<UserLocation | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("city, region, state, country, latitude, longitude")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.latitude || !data?.longitude) {
    return null;
  }

  return {
    city: data.city,
    region: data.region,
    state: data.state,
    country: data.country,
    latitude: data.latitude,
    longitude: data.longitude,
  };
}

export async function saveUserLocation(userId: string, location: UserLocation): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      city: location.city,
      region: location.region,
      state: location.state,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      location_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);
}

/** Detect approximate location from IP — suggestion only, never saved automatically. */
export async function suggestLocationFromIp(): Promise<UserLocation | null> {
  return detectLocationFromIp();
}

/** Geocode a city + state into coordinates (OpenStreetMap Nominatim). */
export async function geocodeCityState(
  city: string,
  stateCode: string,
): Promise<UserLocation | null> {
  const trimmedCity = city.trim();
  const stateName = getStateName(stateCode) ?? stateCode;

  if (!trimmedCity || !stateCode) return null;

  try {
    const params = new URLSearchParams({
      city: trimmedCity,
      state: stateName,
      country: "US",
      format: "json",
      limit: "1",
    });

    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { Accept: "application/json", "User-Agent": "ChronoShare/1.0" },
    });

    if (!res.ok) return null;

    const results = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name?: string;
    }>;

    const hit = results[0];
    if (!hit) return null;

    return {
      city: trimmedCity,
      region: stateName,
      state: stateCode,
      country: "US",
      latitude: parseFloat(hit.lat),
      longitude: parseFloat(hit.lon),
    };
  } catch {
    return null;
  }
}

/** Load the user's saved profile location only (no IP fallback). */
export async function getUserLocation(userId: string): Promise<UserLocation | null> {
  return fetchSavedUserLocation(userId);
}

/** @deprecated Use getUserLocation — kept for callers that expect this name. */
export async function resolveUserLocation(userId: string): Promise<UserLocation | null> {
  return getUserLocation(userId);
}

function normalizeState(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().toLowerCase();
}

export function enrichPostsWithDistance(
  posts: PostWithAuthor[],
  userLocation: UserLocation,
): NearbyPost[] {
  const userState = normalizeState(userLocation.state);

  return posts.map((post) => {
    if (post.latitude != null && post.longitude != null) {
      return {
        ...post,
        distanceMiles: haversineDistanceMiles(
          userLocation.latitude,
          userLocation.longitude,
          post.latitude,
          post.longitude,
        ),
        matchType: "distance" as const,
      };
    }

    if (userState && normalizeState(post.state) === userState) {
      return { ...post, distanceMiles: null, matchType: "state" as const };
    }

    return { ...post, distanceMiles: null, matchType: "unknown" as const };
  });
}

export type NearbySort = "nearest" | "newest";

export function filterAndSortNearbyPosts(
  posts: NearbyPost[],
  radiusMiles: number,
  sort: NearbySort,
): NearbyPost[] {
  const withinRadius = posts.filter((post) => {
    if (post.matchType === "distance" && post.distanceMiles != null) {
      return post.distanceMiles <= radiusMiles;
    }
    if (post.matchType === "state") {
      return true;
    }
    return false;
  });

  const sorted = [...withinRadius];
  if (sort === "nearest") {
    sorted.sort((a, b) => {
      if (a.matchType === "distance" && b.matchType === "distance") {
        return (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity);
      }
      if (a.matchType === "distance") return -1;
      if (b.matchType === "distance") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  } else {
    sorted.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  return sorted;
}

export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}
