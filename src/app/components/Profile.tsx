import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Monitor,
  Trash2,
  FolderOpen,
  HardDrive,
  Star,
  Sparkles,
  Sun,
  Leaf,
  HelpCircle,
  Briefcase,
  Award,
  Zap,
  UserCircle,
} from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import {
  fetchMyExchanges,
  getExchangePartner,
  getExchangeHourType,
  confirmExchange,
  cancelExchange,
  hasUserConfirmed,
  isPartnerConfirmed,
  getExchangePartnerId,
  getExchangePartnerLabel,
} from "../../lib/exchanges";
import type { ExchangeWithProfiles } from "../../types/database";
import { dashColors } from "./onboarding/aeroTheme";
import { formatExchangeFormat } from "../../lib/exchange-format";
import { ProfileFloatingWindow } from "./profile/ProfileFloatingWindow";
import { ProfileWin7Window } from "./profile/ProfileWin7Window";
import { ProfileAeroWallpaper } from "./profile/ProfileAeroWallpaper";
import { ProfileMobile } from "./profile/ProfileMobile";
import { useIsMobile } from "./ui/use-mobile";
import { MyListingsPanel } from "./MyListingsPanel";
import { MemberProfileModal } from "./MemberProfileModal";
import { ExchangeDetailModal } from "./ExchangeDetailModal";
import { fetchMyPosts } from "../../lib/posts";
import {
  isProfileDesktopHintPending,
  markProfileDesktopHintSeen,
} from "../utils/onboarding";
import type { BoardTab } from "./JobBoard";
import type { LucideIcon } from "lucide-react";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type DesktopIconDef = {
  id: string;
  label: string;
  Icon: LucideIcon;
  window: ProfileWindowId | null;
};

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: "profile", label: "My\nProfile", Icon: HardDrive, window: "profile" },
  { id: "ledger", label: "Exchange\nLedger", Icon: FolderOpen, window: "ledger" },
  { id: "listings", label: "My\nListings", Icon: Briefcase, window: "listings" },
  { id: "computer", label: "My\nComputer", Icon: Monitor, window: null },
  { id: "recycle", label: "Recycle\nBin", Icon: Trash2, window: null },
  { id: "help", label: "Chrono\nHelp", Icon: HelpCircle, window: null },
];

type ProfileWindowId = "profile" | "ledger" | "pending" | "listings";

type WindowFrame = { x: number; y: number; width: number };

type ProfileWindowState = {
  maximized: boolean;
  minimized: boolean;
  restored: WindowFrame;
};

const WINDOW_LABELS: Record<ProfileWindowId, string> = {
  profile: "My Profile",
  ledger: "Exchange Ledger",
  pending: "Awaiting Confirmation",
  listings: "My Listings",
};

const RESTORED_FRAMES: Record<ProfileWindowId, WindowFrame> = {
  profile: { x: 72, y: 20, width: 520 },
  ledger: { x: 112, y: 56, width: 480 },
  pending: { x: 152, y: 92, width: 440 },
  listings: { x: 92, y: 38, width: 500 },
};

function defaultWindowState(id: ProfileWindowId): ProfileWindowState {
  return { maximized: true, minimized: false, restored: RESTORED_FRAMES[id] };
}

const START_TIPS = [
  "Trade an hour of guitar for an hour of gardening — everyone's time counts equally.",
  "Both people must confirm before hours move. Check Awaiting Confirmation!",
  "Offer time to earn hours from the community pool. Request help to spend them.",
  "Your nearby map shows listings in Aero vision™ (patent pending, year 2007).",
  "Solarpunk tip: the best exchange leaves both people sunnier than before.",
];

const TIME_FACTS = [
  "An hour saved is an hour earned — unless it's daylight saving. Then who knows.",
  "ChronoShare runs on renewable time. No fossil minutes were burned today.",
  "Your clock is synced to the community sun dial. ±15 minutes of zen.",
];

type EggToast = { title: string; body: string } | null;

type ProfileNavigateOptions = {
  boardTab?: BoardTab;
  postType?: "needs" | "offers";
};

interface ProfileProps {
  onNavigate?: (screen: string, options?: ProfileNavigateOptions) => void;
}

export const Profile = ({ onNavigate }: ProfileProps) => {
  const { user, refreshUser, isPreview } = useAuth();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<"all" | "given" | "received">("all");
  const [exchanges, setExchanges] = useState<ExchangeWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [listingStats, setListingStats] = useState({ active: 0, total: 0 });
  const [eggToast, setEggToast] = useState<EggToast>(null);
  const [wallpaperClicks, setWallpaperClicks] = useState(0);
  const [badgeClicks, setBadgeClicks] = useState(0);
  const [startTipIndex, setStartTipIndex] = useState(0);
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  const [avatarBounces, setAvatarBounces] = useState(false);
  const [openWindows, setOpenWindows] = useState<Set<ProfileWindowId>>(() => new Set());
  const [activeWindow, setActiveWindow] = useState<ProfileWindowId | null>(null);
  const [windowStack, setWindowStack] = useState<ProfileWindowId[]>([]);
  const [windowStates, setWindowStates] = useState<Partial<Record<ProfileWindowId, ProfileWindowState>>>({});
  const desktopLayerRef = useRef<HTMLDivElement>(null);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [viewingMemberLabel, setViewingMemberLabel] = useState<string | undefined>();
  const [selectedExchange, setSelectedExchange] = useState<ExchangeWithProfiles | null>(null);
  const [showDesktopHint, setShowDesktopHint] = useState(false);

  const getWindowState = useCallback(
    (id: ProfileWindowId): ProfileWindowState => windowStates[id] ?? defaultWindowState(id),
    [windowStates],
  );

  const patchWindowState = useCallback((id: ProfileWindowId, patch: Partial<ProfileWindowState>) => {
    setWindowStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? defaultWindowState(id)), ...patch },
    }));
  }, []);

  const showEgg = useCallback((title: string, body: string) => {
    setEggToast({ title, body });
    window.setTimeout(() => setEggToast(null), 4200);
  }, []);

  const loadExchanges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchMyExchanges(user.userId);
      setExchanges(data);
    } catch (err) {
      console.warn("Could not load exchanges:", err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadExchanges();
  }, [loadExchanges]);

  const handleListingStatsChange = useCallback((stats: { active: number; total: number }) => {
    setListingStats(stats);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyPosts(user.userId)
      .then((posts) =>
        setListingStats({
          total: posts.length,
          active: posts.filter((p) => p.status === "active").length,
        }),
      )
      .catch(console.warn);
  }, [user]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user || isPreview || isMobile || user.onboardingCompleted) {
      setShowDesktopHint(false);
      return;
    }
    if (openWindows.size > 0) {
      setShowDesktopHint(false);
      return;
    }
    if (isProfileDesktopHintPending(user.userId)) {
      setShowDesktopHint(true);
      markProfileDesktopHintSeen(user.userId);
    }
  }, [user, isPreview, isMobile, openWindows.size, user?.onboardingCompleted, user?.userId]);

  const history = exchanges
    .filter((ex) => ex.status === "completed")
    .map((ex) => {
      const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
      const hourType = user ? getExchangeHourType(ex, user.userId) : "free";
      return {
        id: ex.id,
        hourType,
        type: hourType === "earned" ? ("given" as const) : hourType === "spent" ? ("received" as const) : ("free" as const),
        name: partner.name,
        task: ex.title,
        hours: ex.hours,
        date: formatDate(ex.completed_at ?? ex.created_at),
        status: ex.status,
        raw: ex,
      };
    });

  const filtered = history.filter((h) => tab === "all" || h.type === tab);
  const pending = exchanges.filter((ex) => ex.status === "pending");

  const hoursEarned = history.filter((h) => h.hourType === "earned").reduce((sum, h) => sum + h.hours, 0);
  const hoursSpent = history.filter((h) => h.hourType === "spent").reduce((sum, h) => sum + h.hours, 0);
  const netHours = hoursEarned - hoursSpent;

  const achievements = useMemo(() => {
    const list: { icon: ReactNode; label: string; unlocked: boolean }[] = [
      { icon: <Star size={14} />, label: "First exchange", unlocked: history.length >= 1 },
      { icon: <Zap size={14} />, label: "Time in the bank", unlocked: (user?.hoursAvailable ?? 0) > 0 },
      { icon: <Leaf size={14} />, label: "Community gardener", unlocked: hoursEarned >= 3 },
      { icon: <Award size={14} />, label: "Regular trader", unlocked: history.length >= 5 },
      { icon: <Sparkles size={14} />, label: "Listing live", unlocked: listingStats.active >= 1 },
    ];
    return list;
  }, [history.length, user?.hoursAvailable, hoursEarned, listingStats.active]);

  const solarpunkWeather = useMemo(() => {
    const h = user?.hoursAvailable ?? 0;
    if (h >= 5) return { temp: "72°", label: "Sunny with chance of trades", icon: "☀️" };
    if (h >= 1) return { temp: "68°", label: "Partly cloudy, mild barter", icon: "⛅" };
    if (h > 0) return { temp: "65°", label: "Light drizzle of opportunity", icon: "🌤️" };
    return { temp: "62°", label: "Overcast — post an offer!", icon: "🌥️" };
  }, [user?.hoursAvailable]);

  const handleConfirm = async (exchangeId: string) => {
    if (isPreview) return;
    setActionId(exchangeId);
    setError(null);
    try {
      await confirmExchange(exchangeId);
      await refreshUser();
      await loadExchanges();
      setSelectedExchange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm exchange");
    }
    setActionId(null);
  };

  const handleCancel = async (exchangeId: string) => {
    if (isPreview) return;
    setActionId(exchangeId);
    setError(null);
    try {
      await cancelExchange(exchangeId);
      await refreshUser();
      await loadExchanges();
      setSelectedExchange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel exchange");
    }
    setActionId(null);
  };

  const focusWindow = useCallback((id: ProfileWindowId) => {
    setActiveWindow(id);
    setWindowStack((prev) => [...prev.filter((w) => w !== id), id]);
  }, []);

  const openWindow = useCallback(
    (id: ProfileWindowId) => {
      setOpenWindows((prev) => new Set(prev).add(id));
      setWindowStates((prev) => ({
        ...prev,
        [id]: defaultWindowState(id),
      }));
      focusWindow(id);
    },
    [focusWindow],
  );

  const closeWindow = useCallback((id: ProfileWindowId) => {
    setOpenWindows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setWindowStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setWindowStack((prev) => {
      const next = prev.filter((w) => w !== id);
      setActiveWindow((current) => (current === id ? (next[next.length - 1] ?? null) : current));
      return next;
    });
  }, []);

  const minimizeWindow = useCallback((id: ProfileWindowId) => {
    setWindowStates((prev) => {
      const next = {
        ...prev,
        [id]: { ...(prev[id] ?? defaultWindowState(id)), minimized: true },
      };
      setActiveWindow((current) => {
        if (current !== id) return current;
        const visible = windowStack.filter((w) => w !== id && !next[w]?.minimized);
        return visible[visible.length - 1] ?? null;
      });
      return next;
    });
  }, [windowStack]);

  const restoreWindow = useCallback(
    (id: ProfileWindowId) => {
      patchWindowState(id, { minimized: false });
      focusWindow(id);
    },
    [patchWindowState, focusWindow],
  );

  const toggleMaximize = useCallback(
    (id: ProfileWindowId) => {
      if (isMobile) return;
      const state = getWindowState(id);
      patchWindowState(id, { maximized: !state.maximized });
      focusWindow(id);
    },
    [getWindowState, patchWindowState, focusWindow, isMobile],
  );

  const toggleWindow = useCallback(
    (id: ProfileWindowId) => {
      if (!openWindows.has(id)) {
        openWindow(id);
        return;
      }
      const state = getWindowState(id);
      if (state.minimized) {
        restoreWindow(id);
        return;
      }
      if (activeWindow === id) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    },
    [openWindows, activeWindow, getWindowState, openWindow, restoreWindow, minimizeWindow, focusWindow],
  );

  const getWindowZ = useCallback(
    (id: ProfileWindowId) => {
      const idx = windowStack.indexOf(id);
      return 10 + (idx >= 0 ? idx : 0);
    },
    [windowStack],
  );

  const handleDesktopIcon = (icon: DesktopIconDef) => {
    if (icon.window) {
      if (openWindows.has(icon.window)) {
        const state = getWindowState(icon.window);
        if (state.minimized) restoreWindow(icon.window);
        else focusWindow(icon.window);
      } else {
        openWindow(icon.window);
      }
      return;
    }
    if (icon.id === "computer") setShowSystemInfo(true);
    if (icon.id === "recycle") {
      showEgg(
        "Recycle Bin",
        "Nothing here but composted minutes and a faint smell of 2007. Hours never die — they feed the community garden.",
      );
    }
    if (icon.id === "help") {
      showEgg("Chrono Help", "Press the ChronoStart orb for tips. Triple-click Verified for a secret. You're welcome.");
    }
  };

  const handleWallpaperClick = () => {
    const next = wallpaperClicks + 1;
    setWallpaperClicks(next);
    if (next === 5) {
      showEgg("Solarpunk mode", "Engaged ☀️ The desktop photosynthesized slightly. Your hours feel warmer.");
      setWallpaperClicks(0);
    }
  };

  const handleBadgeClick = () => {
    const next = badgeClicks + 1;
    setBadgeClicks(next);
    if (next === 3) {
      showEgg("Time Council", "Identity verified. You may now trade skills with extreme Aero confidence.");
      setBadgeClicks(0);
    }
  };

  const handleAvatarDoubleClick = () => {
    setAvatarBounces(true);
    showEgg("That's you!", "Looking very tradeable today. The community clock approves.");
    window.setTimeout(() => setAvatarBounces(false), 600);
  };

  const handleClockClick = () => {
    showEgg("Time fact", TIME_FACTS[Math.floor(Math.random() * TIME_FACTS.length)]!);
  };

  const handleStartClick = () => {
    showEgg("ChronoStart", START_TIPS[startTipIndex]!);
    setStartTipIndex((i) => (i + 1) % START_TIPS.length);
  };

  const openMemberProfile = (exchange: ExchangeWithProfiles) => {
    if (!user) return;
    setViewingMemberId(getExchangePartnerId(exchange, user.userId));
    setViewingMemberLabel(getExchangePartnerLabel(exchange, user.userId));
  };

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const profileState = getWindowState("profile");
  const ledgerState = getWindowState("ledger");
  const pendingState = getWindowState("pending");
  const listingsState = getWindowState("listings");
  const profileMaximized = isMobile || profileState.maximized;
  const ledgerMaximized = isMobile || ledgerState.maximized;
  const pendingMaximized = isMobile || pendingState.maximized;
  const listingsMaximized = isMobile || listingsState.maximized;
  const givenCount = history.filter((h) => h.type === "given").length;
  const receivedCount = history.filter((h) => h.type === "received").length;

  const navigateFromProfile = useCallback(
    (screen: string, options?: ProfileNavigateOptions) => {
      onNavigate?.(screen, options);
    },
    [onNavigate],
  );

  if (isMobile) {
    return (
      <ProfileMobile
        user={user}
        isPreview={isPreview}
        loading={loading}
        error={error}
        tab={tab}
        onTabChange={setTab}
        history={history}
        filtered={filtered}
        pending={pending}
        hoursEarned={hoursEarned}
        hoursSpent={hoursSpent}
        netHours={netHours}
        achievements={achievements}
        listingStats={listingStats}
        solarpunkWeather={solarpunkWeather}
        actionId={actionId}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onNavigate={navigateFromProfile}
        onListingStatsChange={handleListingStatsChange}
      />
    );
  }

  return (
    <div className="profile-desktop">
      <div className="profile-desktop-backdrop">
        <ProfileAeroWallpaper />
        <button
          type="button"
          className="profile-desktop-wallpaper-hit"
          onClick={handleWallpaperClick}
          aria-label="Desktop wallpaper"
        />
      </div>

      <div className="profile-desktop-icons">
        {DESKTOP_ICONS.map((icon) => {
          const isOpen = icon.window ? openWindows.has(icon.window) : false;
          return (
            <button
              key={icon.id}
              type="button"
              className={`profile-desktop-icon ${isOpen ? "profile-desktop-icon-open" : ""}`}
              onClick={() => handleDesktopIcon(icon)}
            >
              <span className="profile-desktop-icon-img">
                <icon.Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="profile-desktop-icon-label">{icon.label}</span>
            </button>
          );
        })}
        {pending.length > 0 && (
          <button
            type="button"
            className={`profile-desktop-icon profile-desktop-icon-alert ${openWindows.has("pending") ? "profile-desktop-icon-open" : ""}`}
            onClick={() => {
              if (openWindows.has("pending")) {
                const state = getWindowState("pending");
                if (state.minimized) restoreWindow("pending");
                else focusWindow("pending");
              } else {
                openWindow("pending");
              }
            }}
          >
            <span className="profile-desktop-icon-img">
              <Loader2 size={22} strokeWidth={1.75} className="animate-spin" />
            </span>
            <span className="profile-desktop-icon-label">{pending.length} Pending</span>
          </button>
        )}
      </div>

      <aside className="profile-gadgets">
        <div className="profile-gadget">
          <button type="button" className="profile-gadget-clock w-full text-left" onClick={handleClockClick}>
            <p className="profile-gadget-time">{timeStr}</p>
            <p className="profile-gadget-date">{dateStr}</p>
          </button>
        </div>

        <div className="profile-gadget">
          <p className="profile-gadget-heading">Hour Balance</p>
          <p className="profile-gadget-big" style={{ fontFamily: "'DM Mono', monospace" }}>
            {user?.hoursAvailable.toFixed(1) ?? "0.0"}
          </p>
          <p className="profile-gadget-sub">hours available</p>
          <div className="profile-gadget-meter">
            <div
              className="profile-gadget-meter-fill"
              style={{ width: `${Math.min(100, (user?.hoursAvailable ?? 0) * 20)}%` }}
            />
          </div>
        </div>

        <div className="profile-gadget">
          <p className="profile-gadget-heading">Solarpunk Weather</p>
          <p className="profile-gadget-weather">{solarpunkWeather.icon} {solarpunkWeather.temp}</p>
          <p className="profile-gadget-sub">{solarpunkWeather.label}</p>
        </div>

        <div className="profile-gadget profile-gadget-achievements">
          <p className="profile-gadget-heading">Achievements</p>
          <ul className="profile-achievement-list">
            {achievements.map((a) => (
              <li key={a.label} className={a.unlocked ? "profile-achievement-unlocked" : "profile-achievement-locked"}>
                {a.icon}
                <span>{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="profile-windows" ref={desktopLayerRef}>
        {showDesktopHint && (
          <p className="profile-desktop-hint">
            Click a desktop icon to open a window — just like Windows 7.
          </p>
        )}

        {openWindows.has("profile") && !profileState.minimized && (
          <ProfileFloatingWindow
            x={profileState.restored.x}
            y={profileState.restored.y}
            width={profileState.restored.width}
            maximized={profileMaximized}
            zIndex={getWindowZ("profile")}
            boundsRef={desktopLayerRef}
            onPositionChange={(x, y) =>
              patchWindowState("profile", { restored: { ...profileState.restored, x, y } })
            }
            onFocus={() => focusWindow("profile")}
          >
            <ProfileWin7Window
              title={user?.name ?? "User Profile"}
              subtitle="Personal folder"
              icon={<HardDrive size={14} strokeWidth={2.5} />}
              className="profile-window-user"
              active={activeWindow === "profile"}
              maximized={profileMaximized}
              onClose={() => closeWindow("profile")}
              onMinimize={() => minimizeWindow("profile")}
              onMaximize={() => toggleMaximize("profile")}
              onFocus={() => focusWindow("profile")}
            >
            <div className={profileMaximized ? "profile-window-layout-max" : ""}>
              <div className="flex flex-col sm:flex-row items-start gap-5 p-5">
                <button
                  type="button"
                  className={`dash-avatar ${profileMaximized ? "w-24 h-24 text-3xl" : "w-16 h-16 text-xl"} rounded-full flex items-center justify-center font-bold flex-shrink-0 profile-avatar-btn ${avatarBounces ? "profile-avatar-bounce" : ""}`}
                  onDoubleClick={handleAvatarDoubleClick}
                >
                  {user ? getInitials(user.name) : "?"}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className={`font-bold dash-heading ${profileMaximized ? "text-2xl" : "text-lg"}`}>{user?.name ?? "User"}</h2>
                    <button
                      type="button"
                      onClick={handleBadgeClick}
                      className="dash-badge-earn flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      <ShieldCheck size={11} />
                      Verified Identity
                    </button>
                  </div>
                  <p className="text-sm dash-subtext">{user?.email}</p>
                  {user?.username && (
                    <p className="text-xs dash-subtext mt-1">@{user.username}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="profile-chip">
                      <Clock size={12} /> {user?.hoursAvailable.toFixed(1)} hrs available
                    </span>
                    <span className="profile-chip">
                      <Briefcase size={12} /> {listingStats.active} live · {listingStats.total} total listings
                    </span>
                    <span className="profile-chip">
                      <Star size={12} /> {achievements.filter((a) => a.unlocked).length}/{achievements.length} achievements
                    </span>
                  </div>
                </div>
              </div>

              <div id="profile-stats" className={`profile-stats-grid px-5 ${profileMaximized ? "pb-4" : "pb-5"}`}>
                {[
                  { label: "Total Exchanges", value: String(history.length), color: dashColors.earn },
                  { label: "Hours Earned", value: `+${hoursEarned.toFixed(1)}h`, color: dashColors.earn },
                  { label: "Hours Spent", value: `-${hoursSpent.toFixed(1)}h`, color: dashColors.sun },
                  { label: "Net Flow", value: `${netHours >= 0 ? "+" : ""}${netHours.toFixed(1)}h`, color: dashColors.spend },
                ].map((stat) => (
                  <div key={stat.label} className="profile-stat-gadget">
                    <p className="profile-stat-value" style={{ fontFamily: "'DM Mono', monospace", color: stat.color }}>
                      {stat.value}
                    </p>
                    <p className="profile-stat-label">{stat.label}</p>
                  </div>
                ))}
              </div>

              {profileMaximized && (
                <div className="profile-window-panels px-5 pb-5">
                  <section className="profile-panel">
                    <h3 className="profile-panel-title">Exchange breakdown</h3>
                    <ul className="profile-detail-list">
                      <li><span>Completed trades</span><strong>{history.length}</strong></li>
                      <li><span>Hours given (earned)</span><strong style={{ color: dashColors.earn }}>+{hoursEarned.toFixed(1)}h</strong></li>
                      <li><span>Hours received (spent)</span><strong style={{ color: dashColors.spend }}>-{hoursSpent.toFixed(1)}h</strong></li>
                      <li><span>Pending confirmation</span><strong>{pending.length}</strong></li>
                      <li><span>Given vs received</span><strong>{givenCount} / {receivedCount}</strong></li>
                    </ul>
                  </section>
                  <section className="profile-panel">
                    <h3 className="profile-panel-title">Achievements</h3>
                    <ul className="profile-achievement-grid">
                      {achievements.map((a) => (
                        <li key={a.label} className={a.unlocked ? "profile-achievement-card unlocked" : "profile-achievement-card locked"}>
                          {a.icon}
                          <span>{a.label}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="profile-panel profile-panel-wide">
                    <h3 className="profile-panel-title">Account overview</h3>
                    <div className="profile-overview-grid">
                      <div className="profile-overview-item">
                        <p className="profile-overview-label">Hour balance</p>
                        <p className="profile-overview-value" style={{ color: dashColors.hours }}>{user?.hoursAvailable.toFixed(1)} hrs</p>
                        <p className="profile-overview-sub">Ready to trade or request help</p>
                      </div>
                      <div className="profile-overview-item">
                        <p className="profile-overview-label">Listings</p>
                        <p className="profile-overview-value">{listingStats.active} active</p>
                        <p className="profile-overview-sub">{listingStats.total} total posted on the board</p>
                      </div>
                      <div className="profile-overview-item">
                        <p className="profile-overview-label">Community weather</p>
                        <p className="profile-overview-value">{solarpunkWeather.icon} {solarpunkWeather.temp}</p>
                        <p className="profile-overview-sub">{solarpunkWeather.label}</p>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </ProfileWin7Window>
          </ProfileFloatingWindow>
        )}

        {openWindows.has("pending") && pending.length > 0 && !pendingState.minimized && (
          <ProfileFloatingWindow
            x={pendingState.restored.x}
            y={pendingState.restored.y}
            width={pendingState.restored.width}
            maximized={pendingMaximized}
            zIndex={getWindowZ("pending")}
            boundsRef={desktopLayerRef}
            onPositionChange={(x, y) =>
              patchWindowState("pending", { restored: { ...pendingState.restored, x, y } })
            }
            onFocus={() => focusWindow("pending")}
          >
          <ProfileWin7Window
            title="Awaiting Confirmation"
            subtitle={`${pending.length} pending`}
            icon={<Loader2 size={14} className="animate-spin" />}
            className="profile-window-pending"
            active={activeWindow === "pending"}
            maximized={pendingMaximized}
            onClose={() => closeWindow("pending")}
            onMinimize={() => minimizeWindow("pending")}
            onMaximize={() => toggleMaximize("pending")}
            onFocus={() => focusWindow("pending")}
          >
            <div className={pendingMaximized ? "profile-window-layout-max" : ""}>
              <p className="px-5 pt-4 text-xs dash-subtext">
                Both people must confirm before hours are transferred. Review each exchange below.
              </p>
              {pendingMaximized && (
                <div className="profile-ledger-summary px-5 py-3">
                  <div className="profile-ledger-summary-item">
                    <span>Pending</span>
                    <strong>{pending.length}</strong>
                  </div>
                  <div className="profile-ledger-summary-item">
                    <span>Awaiting you</span>
                    <strong>{pending.filter((ex) => user && !hasUserConfirmed(ex, user.userId)).length}</strong>
                  </div>
                  <div className="profile-ledger-summary-item">
                    <span>Awaiting partner</span>
                    <strong>{pending.filter((ex) => user && hasUserConfirmed(ex, user.userId)).length}</strong>
                  </div>
                </div>
              )}
              <div className={`divide-y dash-divider mt-2 ${pendingMaximized ? "profile-pending-grid" : ""}`}>
              {pending.map((ex) => {
                const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
                const partnerLabel = user ? getExchangePartnerLabel(ex, user.userId) : "Community member";
                const userConfirmed = user ? hasUserConfirmed(ex, user.userId) : false;
                const partnerConfirmed = user ? isPartnerConfirmed(ex, user.userId) : false;
                const isSkillOfferRequest = ex.post_type === "offers" && user?.userId === ex.poster_id;
                return (
                  <div
                    key={ex.id}
                    className={`flex flex-col gap-3 px-5 py-4 cursor-pointer hover:bg-white/15 transition-colors ${pendingMaximized ? "profile-pending-card" : ""}`}
                    onClick={() => setSelectedExchange(ex)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedExchange(ex);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dash-heading">{ex.title}</p>
                      <p className="text-xs dash-subtext">
                        {isSkillOfferRequest ? "Requested by" : "With"} {partner.name} · {ex.hours}h
                        {ex.exchange_format ? ` · ${formatExchangeFormat(ex.exchange_format)}` : ""}
                      </p>
                      {pendingMaximized && (
                        <p className="text-[11px] dash-subtext mt-1">
                          Posted {formatDate(ex.created_at)} · {partnerLabel}
                        </p>
                      )}
                    </div>
                    {pendingMaximized && (
                      <div className="profile-confirm-steps">
                        <span className={userConfirmed ? "done" : "pending"}>You confirm</span>
                        <span className="profile-confirm-arrow">→</span>
                        <span className={partnerConfirmed ? "done" : "pending"}>{partner.name.split(" ")[0]} confirms</span>
                        <span className="profile-confirm-arrow">→</span>
                        <span className={userConfirmed && partnerConfirmed ? "done" : "pending"}>Hours transfer</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={`dash-badge px-2 py-0.5 rounded-full ${userConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                        You {userConfirmed ? "confirmed" : "pending"}
                      </span>
                      <span className={`dash-badge px-2 py-0.5 rounded-full ${partnerConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                        {partner.name.split(" ")[0]} {partnerConfirmed ? "confirmed" : "pending"}
                      </span>
                    </div>
                    <div
                      className="flex flex-wrap items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openMemberProfile(ex)}
                        className="dash-btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      >
                        <UserCircle size={13} />
                        View {partnerLabel.toLowerCase()} profile
                      </button>
                      {!userConfirmed && (
                        <button
                          type="button"
                          onClick={() => handleConfirm(ex.id)}
                          disabled={actionId === ex.id || isPreview}
                          className="dash-btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60"
                        >
                          <CheckCircle2 size={13} />
                          Confirm exchange
                        </button>
                      )}
                      {userConfirmed && !partnerConfirmed && (
                        <p className="text-xs dash-subtext">Waiting for {partner.name.split(" ")[0]} to confirm…</p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCancel(ex.id)}
                        disabled={actionId === ex.id || isPreview}
                        className="dash-btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-60"
                      >
                        <XCircle size={13} />
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </ProfileWin7Window>
          </ProfileFloatingWindow>
        )}

        {error && openWindows.size > 0 && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
        )}

        {openWindows.has("ledger") && !ledgerState.minimized && (
          <ProfileFloatingWindow
            x={ledgerState.restored.x}
            y={ledgerState.restored.y}
            width={ledgerState.restored.width}
            maximized={ledgerMaximized}
            zIndex={getWindowZ("ledger")}
            boundsRef={desktopLayerRef}
            onPositionChange={(x, y) =>
              patchWindowState("ledger", { restored: { ...ledgerState.restored, x, y } })
            }
            onFocus={() => focusWindow("ledger")}
          >
          <ProfileWin7Window
            title="Exchange Ledger"
            subtitle={tab}
            icon={<FolderOpen size={14} strokeWidth={2.5} />}
            className="profile-window-ledger"
            id="profile-ledger"
            active={activeWindow === "ledger"}
            maximized={ledgerMaximized}
            onClose={() => closeWindow("ledger")}
            onMinimize={() => minimizeWindow("ledger")}
            onMaximize={() => toggleMaximize("ledger")}
            onFocus={() => focusWindow("ledger")}
          >
          <div className={ledgerMaximized ? "profile-window-layout-max" : ""}>
          <div className="flex items-center justify-between px-5 py-3 border-b dash-divider">
            <p className="text-xs dash-subtext">{filtered.length} completed exchange{filtered.length === 1 ? "" : "s"}</p>
            <div className="dash-pill-group flex rounded-full p-0.5">
              {(["all", "given", "received"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 ${
                    tab === t ? "dash-pill-active" : "dash-pill-inactive"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {ledgerMaximized && (
            <div className="profile-ledger-summary px-5 py-3">
              <div className="profile-ledger-summary-item">
                <span>Total trades</span>
                <strong>{history.length}</strong>
              </div>
              <div className="profile-ledger-summary-item">
                <span>Hours earned</span>
                <strong style={{ color: dashColors.earn }}>+{hoursEarned.toFixed(1)}h</strong>
              </div>
              <div className="profile-ledger-summary-item">
                <span>Hours spent</span>
                <strong style={{ color: dashColors.spend }}>-{hoursSpent.toFixed(1)}h</strong>
              </div>
              <div className="profile-ledger-summary-item">
                <span>Net flow</span>
                <strong style={{ color: netHours >= 0 ? dashColors.earn : dashColors.spend }}>
                  {netHours >= 0 ? "+" : ""}{netHours.toFixed(1)}h
                </strong>
              </div>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm dash-subtext">
              No exchanges yet. Browse the Job Board to join one!
            </div>
          ) : (
            <div className={`divide-y dash-divider overflow-y-auto ${ledgerMaximized ? "profile-ledger-scroll" : "max-h-80"}`}>
              {ledgerMaximized && (
                <div className="profile-ledger-header">
                  <span>Type</span>
                  <span>Task</span>
                  <span>Partner</span>
                  <span>Date</span>
                  <span>Hours</span>
                </div>
              )}
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`${ledgerMaximized ? "profile-ledger-row" : "flex items-center gap-4 px-5 py-3.5 hover:bg-white/30 transition-colors cursor-pointer"} ${ledgerMaximized ? "cursor-pointer hover:bg-white/20" : ""}`}
                  onClick={() => setSelectedExchange(item.raw)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedExchange(item.raw);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className={`${ledgerMaximized ? "profile-ledger-type" : "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"} ${
                      item.type === "given"
                        ? "dash-badge-earn"
                        : item.type === "received"
                          ? "dash-badge-spend"
                          : "dash-badge-neutral"
                    }`}
                  >
                    {item.type === "given" ? (
                      <ArrowUpRight size={14} className="dash-accent-grass" />
                    ) : item.type === "received" ? (
                      <ArrowDownLeft size={14} className="dash-accent" />
                    ) : (
                      <CheckCircle2 size={14} className="dash-subtext" />
                    )}
                    {ledgerMaximized && (
                      <span className="capitalize">{item.type}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dash-heading truncate">{item.task}</p>
                    {!ledgerMaximized && (
                      <p className="text-xs dash-subtext">
                        {item.type === "given"
                          ? "Earned with"
                          : item.type === "received"
                            ? "Paid to"
                            : "Joined"}{" "}
                        {item.name} · {item.date}
                        {item.raw.exchange_format ? ` · ${formatExchangeFormat(item.raw.exchange_format)}` : ""}
                      </p>
                    )}
                  </div>
                  {ledgerMaximized && (
                    <>
                      <p className="text-xs dash-subtext truncate">{item.name}</p>
                      <p className="text-xs dash-subtext">{item.date}</p>
                    </>
                  )}
                  <span
                    className="text-sm font-medium flex-shrink-0"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      color:
                        item.type === "given"
                          ? dashColors.earn
                          : item.type === "received"
                            ? dashColors.spend
                            : dashColors.neutral,
                    }}
                  >
                    {item.type === "given" ? "+" : item.type === "received" ? "-" : ""}
                    {item.type === "free" ? "Free" : `${item.hours}h`}
                  </span>
                </div>
              ))}
            </div>
          )}
          </div>
          </ProfileWin7Window>
          </ProfileFloatingWindow>
        )}

        {openWindows.has("listings") && !listingsState.minimized && (
          <ProfileFloatingWindow
            x={listingsState.restored.x}
            y={listingsState.restored.y}
            width={listingsState.restored.width}
            maximized={listingsMaximized}
            zIndex={getWindowZ("listings")}
            boundsRef={desktopLayerRef}
            onPositionChange={(x, y) =>
              patchWindowState("listings", { restored: { ...listingsState.restored, x, y } })
            }
            onFocus={() => focusWindow("listings")}
          >
            <ProfileWin7Window
              title="My Listings"
              subtitle={`${listingStats.active} active · ${listingStats.total} total`}
              icon={<Briefcase size={14} strokeWidth={2.5} />}
              className="profile-window-listings"
              active={activeWindow === "listings"}
              maximized={listingsMaximized}
              onClose={() => closeWindow("listings")}
              onMinimize={() => minimizeWindow("listings")}
              onMaximize={() => toggleMaximize("listings")}
              onFocus={() => focusWindow("listings")}
            >
              <div className={listingsMaximized ? "profile-window-layout-max" : ""}>
                <p className="px-5 pt-4 text-xs dash-subtext">
                  View, edit, close, or delete your job board listings.
                </p>
                <MyListingsPanel
                  variant="profile"
                  scrollClassName={listingsMaximized ? "profile-ledger-scroll" : "max-h-80"}
                  onStatsChange={handleListingStatsChange}
                />
              </div>
            </ProfileWin7Window>
          </ProfileFloatingWindow>
        )}
      </div>

      <div className="profile-taskbar">
        <button type="button" className="profile-start-btn" onClick={handleStartClick}>
          <Sun size={16} />
          <span>ChronoStart</span>
        </button>
        <div className="profile-taskbar-apps">
          {(["profile", "ledger", "listings", "pending"] as const).map((windowId) => {
            if (windowId === "pending" && pending.length === 0) return null;
            if (!openWindows.has(windowId)) return null;
            const isActive = activeWindow === windowId;
            const isMinimized = getWindowState(windowId).minimized;
            return (
              <button
                key={windowId}
                type="button"
                className={`profile-taskbar-app ${isActive && !isMinimized ? "profile-taskbar-app-active" : ""} ${isMinimized ? "profile-taskbar-app-minimized" : ""}`}
                onClick={() => toggleWindow(windowId)}
              >
                {WINDOW_LABELS[windowId]}
                {windowId === "pending" ? ` (${pending.length})` : ""}
              </button>
            );
          })}
          {openWindows.size === 0 && (
            <span className="profile-taskbar-hint">No windows open</span>
          )}
        </div>
        <div className="profile-taskbar-tray">
          <span className="profile-tray-icon" title="Community online">🌿</span>
          <span className="profile-tray-time">{timeStr}</span>
        </div>
      </div>

      {showSystemInfo && (
        <div className="profile-system-modal" role="dialog" aria-modal="true">
          <ProfileAeroWallpaper className="profile-system-modal-scene" />
          <div className="profile-system-modal-dim" aria-hidden="true" />
          <ProfileWin7Window title="My Computer" subtitle="System properties">
            <div className="p-5 space-y-3 text-sm dash-subtext">
              <p><strong className="dash-heading">OS:</strong> ChronoShare Aero Edition (2007 vibes, 2026 tech)</p>
              <p><strong className="dash-heading">Processor:</strong> Community Time CPU @ ∞ kindness/sec</p>
              <p><strong className="dash-heading">RAM:</strong> {(user?.hoursAvailable ?? 0).toFixed(1)} hours available memory</p>
              <p><strong className="dash-heading">Graphics:</strong> Frutiger Aero GPU with Solarpunk shaders</p>
              <p><strong className="dash-heading">Storage:</strong> {history.length} exchanges on disk C:</p>
              <button
                type="button"
                className="dash-btn-primary mt-2 px-4 py-2 rounded-full text-xs font-semibold"
                onClick={() => setShowSystemInfo(false)}
              >
                OK
              </button>
            </div>
          </ProfileWin7Window>
        </div>
      )}

      {eggToast && (
        <div className="profile-egg-toast" role="status">
          <p className="profile-egg-title">{eggToast.title}</p>
          <p className="profile-egg-body">{eggToast.body}</p>
        </div>
      )}

      <ExchangeDetailModal
        exchange={selectedExchange}
        userId={user?.userId}
        onClose={() => setSelectedExchange(null)}
        onViewPartner={openMemberProfile}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        actionId={actionId}
        isPreview={isPreview}
      />

      <MemberProfileModal
        userId={viewingMemberId}
        roleLabel={viewingMemberLabel}
        onClose={() => {
          setViewingMemberId(null);
          setViewingMemberLabel(undefined);
        }}
      />
    </div>
  );
};
