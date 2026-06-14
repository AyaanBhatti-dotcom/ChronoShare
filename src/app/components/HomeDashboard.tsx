import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import { fetchRecentExchanges, getExchangePartner, fetchPendingExchanges, fetchUserJoinedPostIds, hasUserConfirmed } from "../../lib/exchanges";
import { fetchActivePosts } from "../../lib/posts";
import {
  getUserLocation,
  enrichPostsWithDistance,
  filterAndSortListings,
  formatDistance,
  formatLocationLabel,
  formatPostLocation,
  formatRadiusValue,
  getDistanceUnit,
  type NearbyPost,
  type NearbySort,
  type UserLocation,
} from "../../lib/location";
import { getStoredListingScope, storeListingScope, type ListingScope } from "../../lib/listing-scope";
import { getHourImpact, formatHourImpactLabel, getExchangeHourType } from "../../lib/exchanges";
import type { ExchangeWithProfiles } from "../../types/database";
import { dashColors, impactBadgeStyle } from "./onboarding/aeroTheme";
import { formatExchangeFormat } from "../../lib/exchange-format";
import { NearbyMap } from "./NearbyMap";
import { LocationPicker } from "./LocationPicker";
import { ListingScopeToggle } from "./ListingScopeToggle";
import { ExchangeDetailModal } from "./ExchangeDetailModal";
import { Slider } from "./ui/slider";
import type { BoardTab } from "./JobBoard";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

interface HomeDashboardProps {
  onNavigate: (s: string, options?: { postType?: "needs" | "offers"; boardTab?: BoardTab }) => void;
}

export const HomeDashboard = ({ onNavigate }: HomeDashboardProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [posts, setPosts] = useState<NearbyPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [sort, setSort] = useState<NearbySort>("nearest");
  const [scope, setScope] = useState<ListingScope>(() => getStoredListingScope("home"));
  const [exchanges, setExchanges] = useState<ExchangeWithProfiles[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [needsYourConfirm, setNeedsYourConfirm] = useState(0);
  const [joinedPostIds, setJoinedPostIds] = useState<Set<string>>(() => new Set());
  const [selectedMapPost, setSelectedMapPost] = useState<NearbyPost | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeWithProfiles | null>(null);

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
    fetchPendingExchanges(user.userId)
      .then((pending) => {
        setPendingCount(pending.length);
        setNeedsYourConfirm(
          pending.filter((ex) => !hasUserConfirmed(ex, user.userId)).length,
        );
      })
      .catch(console.warn);
    fetchUserJoinedPostIds(user.userId)
      .then((ids) => setJoinedPostIds(new Set(ids)))
      .catch(console.warn);
  }, [user]);

  const visiblePosts = useMemo(() => {
    return filterAndSortListings(posts, { scope, radiusMiles, sort }).filter(
      (post) => !joinedPostIds.has(post.id),
    );
  }, [posts, scope, radiusMiles, sort, joinedPostIds]);

  const nearbyPosts = useMemo(
    () => visiblePosts.slice(0, scope === "worldwide" ? 12 : 8),
    [visiblePosts, scope],
  );

  const mapPosts = useMemo(
    () =>
      visiblePosts.filter(
        (post) => post.latitude != null && post.longitude != null,
      ),
    [visiblePosts],
  );

  const mapUserLocation: UserLocation = userLocation ?? {
    city: null,
    region: null,
    state: null,
    country: null,
    latitude: 20,
    longitude: 0,
  };

  const radiusIndex = RADIUS_OPTIONS.indexOf(radiusMiles);

  return (
    <div className="space-y-6">
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={() => onNavigate("profile")}
          className="dash-card w-full rounded-2xl p-4 flex items-start gap-3 text-left hover:border-[rgba(45,212,191,0.55)] transition-colors"
        >
          <AlertCircle size={18} className="dash-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold dash-heading">
              {needsYourConfirm > 0
                ? t("home.confirmNeeded", { count: needsYourConfirm })
                : t("home.awaitingPartner", { count: pendingCount })}
            </p>
            <p className="text-xs dash-subtext mt-0.5">
              {t("home.confirmHint")}
            </p>
          </div>
        </button>
      )}

      {/* Location header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} className="dash-accent" />
            <h2 className="text-lg font-semibold dash-heading">
              {scope === "worldwide" ? t("home.listingsAnywhere") : t("home.nearbyListings")}
            </h2>
          </div>
          <p className="text-sm dash-subtext">
            {locationLoading
              ? t("home.loadingLocation")
              : scope === "worldwide"
                ? t("home.worldwideHint")
                : userLocation
                  ? t("home.nearLocation", { location: formatLocationLabel(userLocation) })
                  : t("home.setLocation")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ListingScopeToggle scope={scope} onChange={handleScopeChange} />
          {userLocation && (
          <div className="dash-pill-group flex rounded-full p-1 w-fit">
            {(["nearest", "newest"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSort(option)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sort === option ? "dash-pill-active" : "dash-pill-inactive"
                }`}
              >
                {option === "nearest" ? t("sort.nearest") : t("sort.newest")}
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
        <div className="dash-card dash-map-skeleton rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
        </div>
      ) : userLocation || scope === "worldwide" ? (
        <NearbyMap
          userLocation={mapUserLocation}
          posts={mapPosts}
          radiusMiles={radiusMiles}
          worldwide={scope === "worldwide"}
          showUserMarker={Boolean(userLocation)}
          selectedPost={selectedMapPost}
          onSelectPost={setSelectedMapPost}
          onClosePost={() => setSelectedMapPost(null)}
          onOpenBoard={() => onNavigate("board")}
        />
      ) : null}

      {/* Radius control */}
      {userLocation && scope === "nearby" && (
        <div className="dash-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium dash-heading">{t("home.searchRadius")}</p>
            <span
              className="text-sm font-semibold dash-accent"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {formatRadiusValue(radiusMiles)} {getDistanceUnit()}
            </span>
          </div>
          <Slider
            min={0}
            max={RADIUS_OPTIONS.length - 1}
            step={1}
            value={[radiusIndex >= 0 ? radiusIndex : 2]}
            onValueChange={([value]) => setRadiusMiles(RADIUS_OPTIONS[value] ?? 25)}
            className="[&_[data-slot=slider-track]]:bg-white/40 [&_[data-slot=slider-range]]:bg-[#3dd9c8] [&_[data-slot=slider-thumb]]:border-[#18a89e]"
          />
          <div className="flex justify-between text-[10px] dash-subtext uppercase tracking-wide">
            {RADIUS_OPTIONS.map((miles) => (
              <span key={miles}>{formatRadiusValue(miles)}{getDistanceUnit()}</span>
            ))}
          </div>
        </div>
      )}

      {/* Listing cards */}
      {(userLocation || scope === "worldwide") && (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold dash-heading flex items-center gap-2">
            <Sparkles size={14} className="dash-accent-grass" />
            {scope === "worldwide" ? t("home.opportunitiesWorldwide") : t("home.newInArea")}
          </h3>
          <button
            onClick={() => onNavigate("board")}
            className="flex items-center gap-1 text-xs dash-link"
          >
            {t("common.viewAll")} <ChevronRight size={14} />
          </button>
        </div>

        {postsLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
          </div>
        ) : nearbyPosts.length === 0 ? (
          <div className="dash-card rounded-2xl p-8 text-center">
            <p className="text-sm dash-subtext mb-3">
              {scope === "worldwide"
                ? t("home.noListingsWorldwide")
                : t("home.noListingsNearby", { radius: formatRadiusValue(radiusMiles), unit: getDistanceUnit() })}
            </p>
            <button
              onClick={() => onNavigate("post")}
              className="text-xs dash-link"
            >
              {t("home.beFirst")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {nearbyPosts.map((post) => {
              const name = post.profiles?.full_name ?? t("common.user");
              const impact = getHourImpact(post.post_type, true, post.hours_cost);
              const isOwn = user?.userId === post.user_id;
              const badgeStyle = impactBadgeStyle(
                impact.direction === "earn" ? "earn" : impact.direction === "spend" ? "spend" : "neutral",
              );
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onNavigate("board")}
                  className={`dash-card dash-card-hover rounded-2xl p-4 text-left transition-all ${isOwn ? "dash-card-own" : ""}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="dash-avatar w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs dash-subtext mb-0.5">{name}</p>
                      <h4 className="text-sm font-semibold dash-heading leading-snug line-clamp-2">
                        {post.title}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs dash-subtext">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="dash-accent" />
                        {scope === "worldwide"
                          ? formatPostLocation(post)
                          : post.matchType === "state"
                            ? formatPostLocation(post)
                            : formatDistance(post.distanceMiles)}
                      </span>
                      <span className="dash-subtext">
                        {formatExchangeFormat(post.exchange_format)}
                      </span>
                      <span
                        className="flex items-center gap-1 dash-accent"
                        style={{ fontFamily: "'DM Mono', monospace" }}
                      >
                        <Clock size={11} />
                        {post.hours_cost}h
                      </span>
                    </div>
                    {!isOwn && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={badgeStyle}
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
        <div className="dash-card dash-card-hero rounded-2xl p-6 text-center" data-tour="quick-actions">
          <p className="text-xs dash-subtext uppercase tracking-wide mb-2">{t("home.availableBalance")}</p>
          <p
            className="text-5xl font-semibold dash-heading mb-1"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            {user?.hoursAvailable.toFixed(1) ?? "0.0"}
          </p>
          <p className="dash-accent-grass text-sm mb-4">{t("common.hours")}</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
            <button
              onClick={() => onNavigate("post", { postType: "offers" })}
              className="dash-btn-primary px-5 py-2 rounded-full text-xs font-semibold w-full sm:w-auto"
            >
              {t("home.offerTime")}
            </button>
            <button
              onClick={() => onNavigate("post", { postType: "needs" })}
              className="dash-btn-outline px-5 py-2 rounded-full text-xs font-semibold w-full sm:w-auto"
            >
              {t("home.requestTime")}
            </button>
          </div>
        </div>

        <div className="dash-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b dash-divider">
            <h3 className="text-sm font-semibold dash-heading">{t("home.recentExchanges")}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("board", { boardTab: "past" })}
                className="text-xs dash-subtext hover:dash-heading transition-colors"
              >
                {t("home.pastJobs")}
              </button>
              <button
                onClick={() => onNavigate("profile")}
                className="flex items-center gap-1 text-xs dash-link"
              >
                {t("common.viewAll")} <ChevronRight size={14} />
              </button>
            </div>
          </div>
          {exchanges.length === 0 ? (
            <p className="px-5 py-6 text-sm dash-subtext text-center">{t("home.noExchanges")}</p>
          ) : (
            <div className="divide-y dash-divider">
              {exchanges.map((ex) => {
                const partner = user ? getExchangePartner(ex, user.userId) : { name: t("common.user"), role: "helper" as const };
                const hourType = user ? getExchangeHourType(ex, user.userId) : "free";
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => setSelectedExchange(ex)}
                    className="flex items-center gap-3 px-5 py-3 w-full text-left hover:bg-white/10 transition-colors"
                  >
                    <div className="dash-avatar w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold">
                      {getInitials(partner.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs dash-heading truncate">{ex.title}</p>
                      <p className="text-[10px] dash-subtext">{partner.name}</p>
                    </div>
                    <span
                      className="text-xs font-medium flex items-center gap-0.5"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        color:
                          hourType === "earned"
                            ? dashColors.earn
                            : hourType === "spent"
                              ? dashColors.spend
                              : dashColors.neutral,
                      }}
                    >
                      {hourType === "earned" ? <ArrowUpRight size={10} /> : hourType === "spent" ? <ArrowDownRight size={10} /> : null}
                      {hourType === "free" ? t("home.free") : `${hourType === "earned" ? "+" : "-"}${ex.hours}h`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ExchangeDetailModal
        exchange={selectedExchange}
        userId={user?.userId}
        onClose={() => setSelectedExchange(null)}
      />
    </div>
  );
};
