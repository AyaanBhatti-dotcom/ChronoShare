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

/** Geocode a city + state into coordinates (Photon geocoder). */
export async function geocodeCityState(
  city: string,
  stateCode: string,
): Promise<UserLocation | null> {
  const trimmedCity = city.trim();
  const stateName = getStateName(stateCode) ?? stateCode;

  if (!trimmedCity || !stateCode) return null;

  try {
    const features = await fetchPhoton(`${trimmedCity}, ${stateName}`, 8);

    for (const feature of features) {
      const suggestion = featureToSuggestion(feature);
      if (!suggestion || suggestion.state !== stateCode) continue;

      const cityMatches =
        suggestion.city.toLowerCase() === trimmedCity.toLowerCase() ||
        suggestion.city.toLowerCase().includes(trimmedCity.toLowerCase()) ||
        trimmedCity.toLowerCase().includes(suggestion.city.toLowerCase());

      if (!cityMatches) continue;

      return {
        city: suggestion.city,
        region: suggestion.stateName,
        state: suggestion.state,
        country: "US",
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      };
    }

    const fallback = features
      .map(featureToSuggestion)
      .find((s) => s && s.state === stateCode);

    if (!fallback) return null;

    return {
      city: fallback.city,
      region: fallback.stateName,
      state: fallback.state,
      country: "US",
      latitude: fallback.latitude,
      longitude: fallback.longitude,
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

export interface LocationSuggestion {
  city: string;
  state: string;
  stateName: string;
  label: string;
  latitude: number;
  longitude: number;
}

/** Continental US bounding box for Photon searches */
const US_BBOX = "-125,24,-66,50";

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
    bbox: US_BBOX,
  });

  const res = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  return data.features ?? [];
}

function isUsPlaceFeature(props: PhotonFeature["properties"]): boolean {
  if (props.countrycode !== "US" || !props.state) return false;
  if (props.osm_key === "place") return true;
  return PHOTON_PLACE_VALUES.has(props.osm_value ?? "");
}

function featureToSuggestion(feature: PhotonFeature): LocationSuggestion | null {
  const props = feature.properties;
  if (!isUsPlaceFeature(props)) return null;

  const stateCode = getStateCode(props.state ?? "");
  if (!stateCode) return null;

  const city =
    props.name ??
    props.city ??
    props.town ??
    props.locality;
  if (!city) return null;

  const [longitude, latitude] = feature.geometry.coordinates;
  const stateName = getStateName(stateCode) ?? props.state ?? stateCode;

  return {
    city,
    state: stateCode,
    stateName,
    label: `${city}, ${stateCode}`,
    latitude,
    longitude,
  };
}

/** US city/state suggestions (Photon — works from the browser; Nominatim blocks CORS). */
export async function searchLocationSuggestions(
  query: string,
  limit = 6,
): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const features = await fetchPhoton(trimmed, Math.max(limit * 2, 10));
    const seen = new Set<string>();
    const suggestions: LocationSuggestion[] = [];

    for (const feature of features) {
      const suggestion = featureToSuggestion(feature);
      if (!suggestion) continue;

      const key = `${suggestion.city.toLowerCase()}|${suggestion.state}`;
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
