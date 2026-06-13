import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import { fetchRecentExchanges, getExchangePartner } from "../../lib/exchanges";
import { fetchActivePosts } from "../../lib/posts";
import {
  getUserLocation,
  enrichPostsWithDistance,
  filterAndSortListings,
  formatDistance,
  formatLocationLabel,
  formatPostLocation,
  type NearbyPost,
  type NearbySort,
  type UserLocation,
} from "../../lib/location";
import { getStoredListingScope, storeListingScope, type ListingScope } from "../../lib/listing-scope";
import { getHourImpact, formatHourImpactLabel, getExchangeHourType } from "../../lib/exchanges";
import type { ExchangeWithProfiles } from "../../types/database";
import { NearbyMap } from "./NearbyMap";
import { LocationPicker } from "./LocationPicker";
import { ListingScopeToggle } from "./ListingScopeToggle";
import { Slider } from "./ui/slider";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

interface HomeDashboardProps {
  onNavigate: (s: string, options?: { postType?: "needs" | "offers" }) => void;
}

export const HomeDashboard = ({ onNavigate }: HomeDashboardProps) => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [posts, setPosts] = useState<NearbyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [sort, setSort] = useState<NearbySort>("nearest");
  const [scope, setScope] = useState<ListingScope>(() => getStoredListingScope("home"));
  const [exchanges, setExchanges] = useState<ExchangeWithProfiles[]>([]);

  const handleScopeChange = (next: ListingScope) => {
    setScope(next);
    storeListingScope(next, "home");
  };

  const loadLocation = useCallback(async () => {
    if (!user) return;
    setLocationLoading(true);
    try {
      const location = await getUserLocation(user.userId);
      setUserLocation(location);
    } catch (err) {
      console.warn(err);
    } finally {
      setLocationLoading(false);
    }
  }, [user]);

  const handleLocationSaved = (location: UserLocation) => {
    setUserLocation(location);
  };

  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const active = await fetchActivePosts();
      if (userLocation) {
        setPosts(enrichPostsWithDistance(active, userLocation));
      } else {
        setPosts(
          active.map((post) => ({
            ...post,
            distanceMiles: null,
            matchType: "unknown" as const,
          })),
        );
      }
    } catch (err) {
      console.warn("Could not load nearby listings:", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [userLocation]);

  useEffect(() => {
    loadLocation();
  }, [loadLocation]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!user) return;
    fetchRecentExchanges(user.userId, 3)
      .then(setExchanges)
      .catch(console.warn);
  }, [user]);

  const nearbyPosts = useMemo(() => {
    const sorted = filterAndSortListings(posts, { scope, radiusMiles, sort });
    return sorted.slice(0, scope === "worldwide" ? 12 : 8);
  }, [posts, scope, radiusMiles, sort]);

  const radiusIndex = RADIUS_OPTIONS.indexOf(radiusMiles);

  return (
    <div className="space-y-6">
      {/* Location header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">
              {scope === "worldwide" ? "Listings Anywhere" : "Nearby Listings"}
            </h2>
          </div>
          <p className="text-sm text-[#9CA3AF]">
            {locationLoading
              ? "Loading your location..."
              : scope === "worldwide"
                ? "Traveling? Browse opportunities worldwide and offer help wherever you go."
                : userLocation
                  ? `Showing opportunities near ${formatLocationLabel(userLocation)}`
                  : "Set your location to see nearby listings on the map"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ListingScopeToggle scope={scope} onChange={handleScopeChange} />
          {userLocation && (
          <div
            className="flex rounded-full p-1 w-fit"
            style={{ background: "#111827", border: "1px solid #1F2937" }}
          >
            {(["nearest", "newest"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSort(option)}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: sort === option ? "#10B981" : "transparent",
                  color: sort === option ? "#000" : "#9CA3AF",
                }}
              >
                {option === "nearest" ? "Nearest" : "Newest"}
              </button>
            ))}
          </div>
          )}
        </div>
      </div>

      {!locationLoading && !userLocation && (
        <LocationPicker onSaved={handleLocationSaved} />
      )}

      {/* Map */}
      {locationLoading ? (
        <div
          className="h-[340px] rounded-2xl border flex items-center justify-center"
          style={{ background: "#111827", borderColor: "#1F2937" }}
        >
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : userLocation ? (
        <NearbyMap
          userLocation={userLocation}
          posts={nearbyPosts}
          radiusMiles={radiusMiles}
          worldwide={scope === "worldwide"}
          onSelectPost={() => onNavigate("board")}
        />
      ) : null}

      {/* Radius control */}
      {userLocation && scope === "nearby" && (
        <div
          className="rounded-2xl p-5 border space-y-4"
          style={{ background: "#111827", borderColor: "#1F2937" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Search radius</p>
            <span
              className="text-sm font-semibold text-emerald-400"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {radiusMiles} mi
            </span>
          </div>
          <Slider
            min={0}
            max={RADIUS_OPTIONS.length - 1}
            step={1}
            value={[radiusIndex >= 0 ? radiusIndex : 2]}
            onValueChange={([value]) => setRadiusMiles(RADIUS_OPTIONS[value] ?? 25)}
            className="[&_[data-slot=slider-track]]:bg-[#1F2937] [&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-[#6B7280] uppercase tracking-wide">
            {RADIUS_OPTIONS.map((miles) => (
              <span key={miles}>{miles}mi</span>
            ))}
          </div>
        </div>
      )}

      {/* Listing cards */}
      {(userLocation || scope === "worldwide") && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400" />
            {scope === "worldwide" ? "Opportunities worldwide" : "New in your area"}
          </h3>
          <button
            onClick={() => onNavigate("board")}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>

        {postsLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : nearbyPosts.length === 0 ? (
          <div
            className="rounded-2xl border p-8 text-center"
            style={{ background: "#111827", borderColor: "#1F2937" }}
          >
            <p className="text-sm text-[#9CA3AF] mb-3">
              {scope === "worldwide"
                ? "No active listings yet."
                : `No listings within ${radiusMiles} miles yet.`}
            </p>
            <button
              onClick={() => onNavigate("post")}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Be the first to post in your area
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {nearbyPosts.map((post) => {
              const name = post.profiles?.full_name ?? "User";
              const impact = getHourImpact(post.post_type, true, post.hours_cost);
              const isOwn = user?.userId === post.user_id;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onNavigate("board")}
                  className="rounded-2xl p-4 border text-left transition-all hover:border-emerald-500/40"
                  style={{
                    background: "#111827",
                    borderColor: isOwn ? "rgba(16,185,129,0.35)" : "#1F2937",
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                    >
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#9CA3AF] mb-0.5">{name}</p>
                      <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2">
                        {post.title}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-emerald-400" />
                        {scope === "worldwide"
                          ? formatPostLocation(post)
                          : post.matchType === "state"
                            ? formatPostLocation(post)
                            : formatDistance(post.distanceMiles)}
                      </span>
                      <span className="flex items-center gap-1" style={{ fontFamily: "'DM Mono', monospace", color: "#10B981" }}>
                        <Clock size={11} />
                        {post.hours_cost}h
                      </span>
                    </div>
                    {!isOwn && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background:
                            impact.direction === "earn"
                              ? "rgba(16,185,129,0.15)"
                              : impact.direction === "spend"
                                ? "rgba(6,182,212,0.15)"
                                : "rgba(107,114,128,0.15)",
                          color:
                            impact.direction === "earn"
                              ? "#10B981"
                              : impact.direction === "spend"
                                ? "#06B6D4"
                                : "#9CA3AF",
                        }}
                      >
                        {formatHourImpactLabel(impact)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Compact balance + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div
          className="rounded-2xl p-6 border text-center"
          style={{ background: "#111827", borderColor: "#1F2937" }}
        >
          <p className="text-xs text-[#9CA3AF] uppercase tracking-wide mb-2">Available Balance</p>
          <p
            className="text-5xl font-semibold text-white mb-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {user?.hoursAvailable.toFixed(1) ?? "0.0"}
          </p>
          <p className="text-emerald-400 text-sm mb-4">Hours</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onNavigate("post", { postType: "offers" })}
              className="px-5 py-2 rounded-full text-xs font-semibold"
              style={{ background: "#10B981", color: "#000" }}
            >
              Offer Time
            </button>
            <button
              onClick={() => onNavigate("post", { postType: "needs" })}
              className="px-5 py-2 rounded-full text-xs font-semibold border"
              style={{ borderColor: "#10B981", color: "#10B981" }}
            >
              Request Time
            </button>
          </div>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ background: "#111827", borderColor: "#1F2937" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#1F2937" }}>
            <h3 className="text-sm font-semibold text-white">Recent Exchanges</h3>
            <button
              onClick={() => onNavigate("profile")}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          {exchanges.length === 0 ? (
            <p className="px-5 py-6 text-sm text-[#9CA3AF] text-center">No exchanges yet.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "#1F2937" }}>
              {exchanges.map((ex) => {
                const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
                const hourType = user ? getExchangeHourType(ex, user.userId) : "free";
                return (
                  <div key={ex.id} className="flex items-center gap-3 px-5 py-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
                      style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                    >
                      {getInitials(partner.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{ex.title}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{partner.name}</p>
                    </div>
                    <span
                      className="text-xs font-medium flex items-center gap-0.5"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        color:
                          hourType === "earned"
                            ? "#10B981"
                            : hourType === "spent"
                              ? "#06B6D4"
                              : "#9CA3AF",
                      }}
                    >
                      {hourType === "earned" ? <ArrowUpRight size={10} /> : hourType === "spent" ? <ArrowDownRight size={10} /> : null}
                      {hourType === "free" ? "Free" : `${hourType === "earned" ? "+" : "-"}${ex.hours}h`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
