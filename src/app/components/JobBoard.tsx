import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  Clock, ChevronDown, Search, X, ArrowUpRight, ArrowDownRight,
  CheckCircle2, PlusCircle, MapPin, Trash2,
} from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import { deletePost, fetchActivePosts } from "../../lib/posts";
import { acceptPost, fetchExchangesForPosts, fetchUserJoinedPostIds, getHourImpact, formatHourImpactLabel } from "../../lib/exchanges";
import {
  enrichPostsWithDistance,
  filterAndSortListings,
  formatDistance,
  formatPostLocation,
  getUserLocation,
  type NearbyPost,
  type NearbySort,
  type UserLocation,
} from "../../lib/location";
import { getStoredListingScope, storeListingScope, type ListingScope } from "../../lib/listing-scope";
import { impactBadgeStyle } from "./onboarding/aeroTheme";
import { ExchangeFormatSelector } from "./ExchangeFormatSelector";
import {
  formatListingFormatLine,
  isFlexibleFormat,
  type ExchangeFormatResolved,
} from "../../lib/exchange-format";
import { getMemberDisplayName } from "../../lib/profile";
import { fetchBlockedUserIds } from "../../lib/trust-safety";
import { SafetyTipBanner } from "./safety/SafetyTipBanner";
import { ListingScopeToggle } from "./ListingScopeToggle";
import { PastJobsPanel } from "./PastJobsPanel";
import { ContactEmailButton } from "./ContactEmailButton";

const categories = ["All", "Tech", "Labor", "Education", "Music", "Cooking", "Design"];

const categoryIcon = (cat: string) => {
  const map: Record<string, React.ReactNode> = {
    Tech: <Monitor size={14} />,
    Labor: <Wrench size={14} />,
    Education: <BookOpen size={14} />,
    Music: <Music size={14} />,
    Cooking: <ChefHat size={14} />,
    Design: <Palette size={14} />,
  };
  return map[cat] || <Monitor size={14} />;
};

type BoardMode = "all" | "needs" | "offers";
export type BoardTab = "open" | "past";

interface JobBoardProps {
  onNavigate?: (screen: string, options?: { postType?: "needs" | "offers"; boardMode?: BoardMode; boardTab?: BoardTab }) => void;
  initialMode?: BoardMode;
  initialTab?: BoardTab;
  initialPostId?: string | null;
  onInitialPostHandled?: () => void;
}

export const JobBoard = ({
  onNavigate,
  initialMode = "all",
  initialTab = "open",
  initialPostId = null,
  onInitialPostHandled,
}: JobBoardProps) => {
  const { user, refreshUser, isPreview } = useAuth();
  const [boardTab, setBoardTab] = useState<BoardTab>(initialTab);
  const [mode, setMode] = useState<BoardMode>(initialMode);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<NearbyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<NearbyPost | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [scope, setScope] = useState<ListingScope>(() => getStoredListingScope("board"));
  const [sort, setSort] = useState<NearbySort>("newest");
  const [radiusMiles] = useState(100);
  const [deleting, setDeleting] = useState(false);
  const [joinFormat, setJoinFormat] = useState<ExchangeFormatResolved | null>(null);
  const [joinedPostIds, setJoinedPostIds] = useState<Set<string>>(() => new Set());
  const [matchedExchangeId, setMatchedExchangeId] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(() => new Set());
  const acceptInFlightRef = useRef(false);

  const loadJoinedPostIds = useCallback(async () => {
    if (!user) {
      setJoinedPostIds(new Set());
      return;
    }
    try {
      const ids = await fetchUserJoinedPostIds(user.userId);
      setJoinedPostIds(new Set(ids));
    } catch (err) {
      console.warn("Could not load joined listings:", err);
    }
  }, [user]);

  const loadBlockedUserIds = useCallback(async () => {
    if (!user) {
      setBlockedUserIds(new Set());
      return;
    }
    try {
      const ids = await fetchBlockedUserIds();
      setBlockedUserIds(new Set(ids));
    } catch (err) {
      console.warn("Could not load blocked users:", err);
    }
  }, [user]);

  const handleScopeChange = (next: ListingScope) => {
    setScope(next);
    storeListingScope(next, "board");
  };

  useEffect(() => {
    if (!user) return;
    getUserLocation(user.userId).then(setUserLocation).catch(console.warn);
  }, [user]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivePosts();
      if (userLocation) {
        setJobs(enrichPostsWithDistance(data, userLocation));
      } else {
        setJobs(
          data.map((post) => ({
            ...post,
            distanceMiles: null,
            matchType: "unknown" as const,
          })),
        );
      }
    } catch (err) {
      console.warn("Could not load posts:", err);
      setJobs([]);
    }
    setLoading(false);
  }, [userLocation]);

  useEffect(() => {
    loadJoinedPostIds();
    loadBlockedUserIds();
  }, [loadJoinedPostIds, loadBlockedUserIds]);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setBoardTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (boardTab === "open") {
      loadPosts();
    }
  }, [loadPosts, boardTab]);

  useEffect(() => {
    if (!initialPostId || loading) return;
    const match = jobs.find((job) => job.id === initialPostId);
    if (!match) return;

    setBoardTab("open");
    setMode("all");
    setCategory("All");
    setSearch("");
    setScope((current) => {
      if (current === "nearby") {
        storeListingScope("worldwide", "board");
        return "worldwide";
      }
      return current;
    });
    setSelectedJob(match);
    onInitialPostHandled?.();
  }, [initialPostId, loading, jobs, onInitialPostHandled]);

  const scopedJobs = useMemo(() => {
    const effectiveScope = scope === "nearby" && !userLocation ? "worldwide" : scope;
    return filterAndSortListings(jobs, { scope: effectiveScope, radiusMiles, sort });
  }, [jobs, scope, userLocation, radiusMiles, sort]);

  const filtered = scopedJobs.filter((j) => {
    if (joinedPostIds.has(j.id)) return false;
    if (blockedUserIds.has(j.user_id)) return false;
    const authorName = j.profiles?.full_name ?? "User";
    const matchMode = mode === "all" || j.post_type === mode;
    const matchCat = category === "All" || j.category === category;
    const matchSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      authorName.toLowerCase().includes(search.toLowerCase()) ||
      (j.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchMode && matchCat && matchSearch;
  });

  const handleDelete = async () => {
    if (!selectedJob || isPreview || !isOwnSelected) return;
    if (!window.confirm("Delete this listing? This can't be undone.")) return;

    setDeleting(true);
    setAcceptError(null);
    try {
      await deletePost(selectedJob.id);
      setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id));
      setSelectedJob(null);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Could not delete listing");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    setJoinFormat(null);
    setAcceptError(null);
    setAcceptSuccess(false);
    setMatchedExchangeId(null);
  }, [selectedJob?.id]);

  const closeJobModal = () => {
    if (accepting) return;
    setSelectedJob(null);
    setAcceptSuccess(false);
  };

  useEffect(() => {
    if (!selectedJob || !user || !joinedPostIds.has(selectedJob.id)) {
      return;
    }

    let cancelled = false;
    fetchExchangesForPosts([selectedJob.id])
      .then((map) => {
        if (!cancelled) setMatchedExchangeId(map.get(selectedJob.id)?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setMatchedExchangeId(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedJob, user, joinedPostIds]);

  const handleAccept = async () => {
    if (!selectedJob || isPreview || (user && selectedJob.user_id === user.userId)) return;
    if (joinedPostIds.has(selectedJob.id)) {
      setAcceptError("You have already joined this listing. Confirm it in your Profile.");
      return;
    }
    if (acceptInFlightRef.current) return;

    const needsFormatChoice = isFlexibleFormat(selectedJob.exchange_format);
    if (needsFormatChoice && !joinFormat) {
      setAcceptError("Choose how you'd like to do this exchange — in person or remote.");
      return;
    }

    acceptInFlightRef.current = true;
    setAccepting(true);
    setAcceptError(null);

    try {
      const exchangeId = await acceptPost(
        selectedJob.id,
        needsFormatChoice ? joinFormat ?? undefined : undefined,
      );
      await refreshUser();
      setJoinedPostIds((prev) => new Set(prev).add(selectedJob.id));
      setMatchedExchangeId(exchangeId);
      setAcceptSuccess(true);
      setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id));
      await loadJoinedPostIds();
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Could not accept listing");
      await loadPosts();
      await loadJoinedPostIds();
    } finally {
      acceptInFlightRef.current = false;
      setAccepting(false);
    }
  };

  const hourImpact = selectedJob && user && selectedJob.user_id !== user.userId
    ? getHourImpact(selectedJob.post_type, true, selectedJob.hours_cost)
    : null;

  const isOwnSelected = user && selectedJob?.user_id === user.userId;
  const alreadyJoined = Boolean(selectedJob && joinedPostIds.has(selectedJob.id));

  return (
    <div className="space-y-5">
      <div className="dash-pill-group flex rounded-full p-1 w-fit">
        {(["open", "past"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setBoardTab(tab)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              boardTab === tab ? "dash-pill-active" : "dash-pill-inactive"
            }`}
          >
            {tab === "open" ? "Open Listings" : "Past Jobs"}
          </button>
        ))}
      </div>

      {boardTab === "past" ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs dash-subtext">
              Jobs you&apos;ve completed — confirmed exchanges with the community.
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="dash-search flex items-center gap-2 px-3 py-2 rounded-xl flex-1 sm:w-48">
                <Search size={14} className="dash-subtext" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search past jobs..."
                  className="bg-transparent text-sm dash-heading placeholder:text-[var(--dash-text-faint)] outline-none w-full"
                />
              </div>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="dash-input appearance-none pl-3 pr-8 py-2 rounded-xl text-sm outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dash-subtext pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="dash-pill-scroll w-full sm:w-auto">
              <div className="dash-pill-group flex rounded-full p-1 w-fit min-w-max">
                {(["all", "needs", "offers"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      mode === m ? "dash-pill-active" : "dash-pill-inactive"
                    }`}
                  >
                    {m === "all" ? "All Jobs" : m === "needs" ? "Help Given" : "Skills Shared"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PastJobsPanel mode={mode} category={category} search={search} />
        </>
      ) : (
        <>
      {/* Scope + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <ListingScopeToggle scope={scope} onChange={handleScopeChange} />
          {jobs.length > 0 && scopedJobs.length !== jobs.length && (
            <p className="text-[10px] dash-subtext">
              Showing {scopedJobs.length} of {jobs.length} listings — switch to Anywhere to see all
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {scope === "nearby" && !userLocation && (
            <p className="text-xs text-amber-400">Set your location in Settings to filter nearby.</p>
          )}
          <div className="dash-pill-group flex rounded-full p-1 w-fit">
            {(["nearest", "newest"] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSort(option)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sort === option ? "dash-pill-active" : "dash-pill-inactive"
                }`}
              >
                {option === "nearest" ? "Nearest" : "Newest"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="dash-pill-scroll w-full sm:w-auto">
        <div className="dash-pill-group flex rounded-full p-1 w-fit min-w-max">
          {(["all", "needs", "offers"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                mode === m ? "dash-pill-active" : "dash-pill-inactive"
              }`}
            >
              {m === "all" ? "All Listings" : m === "needs" ? "Needs Help" : "Offering Skills"}
            </button>
          ))}
        </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="dash-search flex items-center gap-2 px-3 py-2 rounded-xl flex-1 sm:w-48">
            <Search size={14} className="dash-subtext" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="bg-transparent text-sm dash-heading placeholder:text-[var(--dash-text-faint)] outline-none w-full"
            />
          </div>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="dash-input appearance-none pl-3 pr-8 py-2 rounded-xl text-sm outline-none cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 dash-subtext pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="dash-card text-center py-16 rounded-2xl">
          <p className="dash-subtext text-sm mb-4">
            {jobs.length === 0
              ? "No active listings yet. Be the first to post!"
              : scope === "nearby" && userLocation
                ? `No listings within ${radiusMiles} miles match your filters. Try "Anywhere".`
                : mode !== "all"
                  ? `No ${mode === "needs" ? "help requests" : "skill offers"} match your filters. Try "All Listings".`
                  : "No listings match your filters."}
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate("post")}
              className="dash-btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            >
              <PlusCircle size={16} />
              Create a listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((job) => {
            const name = job.profiles?.full_name ?? "User";
            const isOwn = user?.userId === job.user_id;
            const impact = getHourImpact(job.post_type, true, job.hours_cost);
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => {
                  setSelectedJob(job);
                  setAcceptError(null);
                  setAcceptSuccess(false);
                  setJoinFormat(null);
                }}
                className={`dash-card dash-card-hover rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 group text-left ${
                  isOwn ? "dash-card-own" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="dash-avatar w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs dash-subtext">{name}</p>
                      {isOwn && (
                        <span className="dash-badge-own text-[10px] px-2 py-0.5 rounded-full font-medium">
                          Your listing
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold dash-heading leading-snug">{job.title}</h3>
                  </div>
                </div>
                {job.description && (
                  <p className="text-xs dash-subtext leading-relaxed line-clamp-2">{job.description}</p>
                )}
                <p className="text-[10px] dash-subtext flex items-center gap-1">
                  <MapPin size={10} className="dash-accent opacity-70" />
                  {scope === "nearby" && job.distanceMiles != null
                    ? `${formatPostLocation(job)} · ${formatDistance(job.distanceMiles)}`
                    : formatPostLocation(job)}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="dash-tag flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium">
                      {categoryIcon(job.category)}
                      {job.category}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs font-medium dash-accent"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      <Clock size={11} />
                      {job.hours_cost}h
                    </span>
                  </div>
                  {isOwn ? (
                    <span className="dash-tag px-4 py-1.5 rounded-full text-xs font-semibold">
                      Live on board
                    </span>
                  ) : (
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-semibold"
                      style={impactBadgeStyle(
                        impact.direction === "earn" ? "earn" : impact.direction === "spend" ? "spend" : "neutral",
                      )}
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

      {/* Detail / Accept modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 dash-modal-overlay"
            onClick={closeJobModal}
          />
          <div className="dash-modal dash-modal-listing relative w-full max-w-md rounded-2xl dash-modal-mobile max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeJobModal}
              className="dash-modal-close"
              aria-label="Close listing"
            >
              <X size={16} />
            </button>

            {acceptSuccess ? (
              <div className="flex flex-col items-center py-8 px-6 gap-4 text-center">
                <CheckCircle2 size={40} className="dash-accent-grass" />
                <div>
                  <h3 className="text-lg font-semibold dash-heading">You&apos;re matched!</h3>
                  <p className="text-sm dash-subtext mt-1">
                    Head to your Profile — both of you must confirm before hours transfer.
                  </p>
                </div>
                {matchedExchangeId && selectedJob && user && (
                  <ContactEmailButton
                    memberId={selectedJob.user_id}
                    exchangeId={matchedExchangeId}
                    username={selectedJob.profiles?.username}
                    className="w-full rounded-xl border dash-divider bg-white/5 px-4 py-3 space-y-1.5 text-left"
                  />
                )}
                <div className="flex flex-col gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      closeJobModal();
                      onNavigate?.("profile");
                    }}
                    className="dash-btn-primary w-full py-3.5 rounded-full text-sm font-semibold"
                  >
                    Open Profile
                  </button>
                  <button
                    type="button"
                    onClick={closeJobModal}
                    className="dash-btn-outline w-full py-3 rounded-full text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="dash-modal-hero">
                  <span className="dash-modal-member-pill">
                    {getMemberDisplayName(selectedJob.profiles)}
                  </span>
                  <h3 className="dash-modal-title">{selectedJob.title}</h3>
                </div>

                <div className="dash-modal-body">
                  {selectedJob.description && (
                    <p className="dash-modal-desc">{selectedJob.description}</p>
                  )}

                  <div className="dash-modal-chips">
                    <span className="dash-modal-chip dash-modal-chip-category">
                      {categoryIcon(selectedJob.category)}
                      {selectedJob.category}
                    </span>
                    <span className="dash-modal-chip dash-modal-chip-hours">
                      <Clock size={12} />
                      {selectedJob.hours_cost}h
                    </span>
                    <span
                      className={`dash-modal-chip ${
                        selectedJob.post_type === "needs"
                          ? "dash-modal-chip-need"
                          : "dash-modal-chip-offer"
                      }`}
                    >
                      {selectedJob.post_type === "needs" ? "Needs help" : "Offering skill"}
                    </span>
                  </div>

                  <div className="dash-modal-info-list">
                    <div className="dash-modal-info-row">
                      <span className="dash-modal-info-icon">
                        <MapPin size={12} />
                      </span>
                      <span>
                        {formatPostLocation(selectedJob)}
                        {selectedJob.distanceMiles != null && (
                          <> · <strong>{formatDistance(selectedJob.distanceMiles)} away</strong></>
                        )}
                      </span>
                    </div>
                    <div className="dash-modal-info-row">
                      <span className="dash-modal-info-icon">
                        <Monitor size={12} />
                      </span>
                      <span>
                        Exchange format:{" "}
                        <strong>
                          {formatListingFormatLine(
                            selectedJob.exchange_format,
                            selectedJob.meeting_preference,
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {!isOwnSelected &&
                    (selectedJob.exchange_format === "in_person" ||
                      joinFormat === "in_person" ||
                      selectedJob.meeting_preference === "public_venue") && (
                    <SafetyTipBanner variant="compact" />
                  )}

                  {!isOwnSelected && isFlexibleFormat(selectedJob.exchange_format) && (
                    <div className="dash-modal-section">
                      <ExchangeFormatSelector
                        mode="join"
                        value={joinFormat}
                        onChange={setJoinFormat}
                        label="How would you like to do this?"
                        hint="The poster is open to either — pick what works for you."
                      />
                    </div>
                  )}

                  {hourImpact && (
                    <div
                      className={`dash-modal-impact ${
                        hourImpact.direction === "free"
                          ? "dash-modal-impact-free"
                          : hourImpact.direction === "earn"
                            ? "dash-modal-impact-earn"
                            : "dash-modal-impact-spend"
                      }`}
                    >
                      {hourImpact.direction === "earn" ? (
                        <ArrowUpRight size={22} className="dash-accent-grass flex-shrink-0" />
                      ) : hourImpact.direction === "spend" ? (
                        <ArrowDownRight size={22} className="dash-accent flex-shrink-0" />
                      ) : (
                        <CheckCircle2 size={22} className="dash-accent-grass flex-shrink-0" />
                      )}
                      <div>
                        <p className="dash-modal-impact-title">
                          {hourImpact.direction === "free"
                            ? "No cost to join"
                            : `You'll ${hourImpact.direction === "earn" ? "earn" : "spend"} ${hourImpact.amount}h`}
                        </p>
                        <p className="dash-modal-impact-desc">
                          {hourImpact.direction === "earn"
                            ? "Hours transfer to you when you join this exchange."
                            : hourImpact.direction === "spend"
                              ? `Requires ${hourImpact.amount}h in your balance.`
                              : "The helper earns from the community pool — you don't pay."}
                        </p>
                      </div>
                    </div>
                  )}

                  {acceptError && (
                    <p className="text-sm font-medium text-red-600">{acceptError}</p>
                  )}

                  {isOwnSelected ? (
                    <div className="space-y-3">
                      <div className="dash-badge-earn rounded-xl p-4 text-center">
                        <p className="text-sm dash-accent font-medium">This is your listing</p>
                        <p className="text-xs dash-subtext mt-1">
                          Others can find and join it here, or remove it below.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting || isPreview}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold border border-red-400/40 text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                        {deleting ? "Deleting..." : "Delete listing"}
                      </button>
                    </div>
                  ) : alreadyJoined ? (
                    <div className="space-y-3">
                      <div className="dash-badge-earn rounded-xl p-4 text-center">
                        <p className="text-sm dash-accent font-medium">You&apos;ve already joined this listing</p>
                        <p className="text-xs dash-subtext mt-1">
                          Head to Profile to confirm the exchange. This listing is no longer open to others.
                        </p>
                      </div>
                      {matchedExchangeId && user && !isPreview && (
                        <ContactEmailButton
                          memberId={selectedJob.user_id}
                          exchangeId={matchedExchangeId}
                          username={selectedJob.profiles?.username}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJob(null);
                          onNavigate?.("profile");
                        }}
                        className="dash-btn-primary w-full py-3.5 rounded-full text-sm font-semibold"
                      >
                        Open Profile
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={
                        accepting ||
                        isPreview ||
                        alreadyJoined ||
                        (isFlexibleFormat(selectedJob.exchange_format) && !joinFormat)
                      }
                      className="dash-btn-primary w-full py-3.5 rounded-full text-base font-bold disabled:opacity-60"
                    >
                      {accepting ? "Joining..." : isPreview ? "Preview mode" : "Join this exchange"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
