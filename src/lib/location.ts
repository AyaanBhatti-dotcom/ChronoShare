import { supabase } from "./supabase";
import type { PostWithAuthor } from "../types/database";
import { getStateName, getStateCode } from "./us-states";

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
  const parts = [
    location.city,
    location.state ?? location.region,
    location.country && location.country !== "US" ? location.country : null,
  ].filter(Boolean);
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
  const userCountry = normalizeState(userLocation.country);

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

    if (userCountry && normalizeState(post.country) === userCountry) {
      return { ...post, distanceMiles: null, matchType: "state" as const };
    }

    return { ...post, distanceMiles: null, matchType: "unknown" as const };
  });
}

export type NearbySort = "nearest" | "newest";

export type ListingScope = "nearby" | "worldwide";

export function formatPostLocation(post: {
  city?: string | null;
  state?: string | null;
  region?: string | null;
  country?: string | null;
}): string {
  const parts = [
    post.city,
    post.state ?? post.region,
    post.country && post.country !== "US" ? post.country : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location unknown";
}

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

export function filterAndSortListings(
  posts: NearbyPost[],
  options: { scope: ListingScope; radiusMiles: number; sort: NearbySort },
): NearbyPost[] {
  if (options.scope === "worldwide") {
    const sorted = [...posts];
    if (options.sort === "nearest") {
      sorted.sort((a, b) => {
        const aDistance = a.distanceMiles ?? Infinity;
        const bDistance = b.distanceMiles ?? Infinity;
        if (aDistance !== bDistance) return aDistance - bDistance;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return sorted;
  }

  return filterAndSortNearbyPosts(posts, options.radiusMiles, options.sort);
}

export function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

export interface LocationSuggestion {
  city: string;
  state: string | null;
  stateName: string | null;
  country: string;
  label: string;
  latitude: number;
  longitude: number;
}

const PHOTON_PLACE_VALUES = new Set([
  "city",
  "town",
  "village",
  "hamlet",
  "suburb",
  "county",
  "district",
  "locality",
  "quarter",
  "island",
]);

interface PhotonFeature {
  properties: {
    name?: string;
    city?: string;
    town?: string;
    locality?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    osm_key?: string;
    osm_value?: string;
  };
  geometry: { coordinates: [number, number] };
}

async function fetchPhoton(query: string, limit: number): Promise<PhotonFeature[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    lang: "en",
  });

  const res = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

function isPlaceFeature(props: PhotonFeature["properties"]): boolean {
  if (!props.countrycode) return false;
  if (props.osm_key === "place") return true;
  return PHOTON_PLACE_VALUES.has(props.osm_value ?? "");
}

function buildSuggestionLabel(
  city: string,
  state: string | null,
  country: string,
): string {
  if (country === "US" && state) return `${city}, ${state}`;
  return [city, state, country].filter(Boolean).join(", ");
}

function featureToSuggestion(feature: PhotonFeature): LocationSuggestion | null {
  const props = feature.properties;
  if (!isPlaceFeature(props)) return null;

  const country = props.countrycode ?? "";
  if (!country) return null;

  const city = props.name ?? props.city ?? props.town ?? props.locality;
  if (!city) return null;

  let state: string | null = props.state ?? null;
  let stateName: string | null = props.state ?? null;

  if (country === "US" && state) {
    const stateCode = getStateCode(state);
    if (stateCode) {
      state = stateCode;
      stateName = getStateName(stateCode) ?? state;
    }
  }

  const [longitude, latitude] = feature.geometry.coordinates;

  return {
    city,
    state,
    stateName,
    country,
    label: buildSuggestionLabel(city, state, country),
    latitude,
    longitude,
  };
}

/** Worldwide city suggestions (Photon — works from the browser; Nominatim blocks CORS). */
export async function searchLocationSuggestions(
  query: string,
  limit = 6,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const features = await fetchPhoton(trimmed, Math.max(limit * 2, 12));
    const seen = new Set<string>();
    const suggestions: LocationSuggestion[] = [];

    for (const feature of features) {
      const suggestion = featureToSuggestion(feature);
      if (!suggestion) continue;

      const key = `${suggestion.city.toLowerCase()}|${suggestion.state ?? ""}|${suggestion.country}`;
      if (seen.has(key)) continue;
      seen.add(key);

      suggestions.push(suggestion);
      if (suggestions.length >= limit) break;
    }

    return suggestions;
  } catch {
    return [];
  }
}

/** Convert a search suggestion into a saved user location. */
export function suggestionToUserLocation(suggestion: LocationSuggestion): UserLocation {
  return {
    city: suggestion.city,
    region: suggestion.stateName,
    state: suggestion.state,
    country: suggestion.country,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
  };
}
