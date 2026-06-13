import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
} from "../../lib/exchanges";
import { fetchMyPosts } from "../../lib/posts";
import type { ExchangeWithProfiles } from "../../types/database";
import { dashColors } from "./onboarding/aeroTheme";
import { formatExchangeFormat } from "../../lib/exchange-format";
import { ProfileWin7Window } from "./profile/ProfileWin7Window";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DESKTOP_ICONS = [
  { id: "profile", label: "My\nProfile", Icon: HardDrive, window: "profile" as const },
  { id: "ledger", label: "Exchange\nLedger", Icon: FolderOpen, window: "ledger" as const },
  { id: "listings", label: "My\nListings", Icon: Briefcase, window: "profile" as const },
  { id: "computer", label: "My\nComputer", Icon: Monitor, window: null },
  { id: "recycle", label: "Recycle\nBin", Icon: Trash2, window: null },
  { id: "help", label: "Chrono\nHelp", Icon: HelpCircle, window: null },
] as const;

type ProfileWindowId = "profile" | "ledger" | "pending";

const WINDOW_LABELS: Record<ProfileWindowId, string> = {
  profile: "My Profile",
  ledger: "Exchange Ledger",
  pending: "Awaiting Confirmation",
};

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

export const Profile = () => {
  const { user, refreshUser, isPreview } = useAuth();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel exchange");
    }
    setActionId(null);
  };

  const openWindow = useCallback((id: ProfileWindowId) => {
    setOpenWindows((prev) => new Set(prev).add(id));
    setActiveWindow(id);
  }, []);

  const closeWindow = useCallback((id: ProfileWindowId) => {
    setOpenWindows((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setActiveWindow((current) => (current === id ? null : current));
  }, []);

  const toggleWindow = useCallback((id: ProfileWindowId) => {
    setOpenWindows((prev) => {
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        setActiveWindow((current) => (current === id ? null : current));
        return next;
      }
      setActiveWindow(id);
      return new Set(prev).add(id);
    });
  }, []);

  const handleDesktopIcon = (icon: (typeof DESKTOP_ICONS)[number]) => {
    if (icon.window) {
      openWindow(icon.window);
      if (icon.id === "listings") {
        showEgg(
          "My Listings",
          `${listingStats.active} active · ${listingStats.total} total — manage them from Post Request.`,
        );
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

  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className="profile-desktop">
      <button
        type="button"
        className="profile-desktop-wallpaper"
        onClick={handleWallpaperClick}
        aria-label="Desktop wallpaper"
      />

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
            onClick={() => openWindow("pending")}
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

      <div className="profile-windows">
        {openWindows.size === 0 && (
          <p className="profile-desktop-hint">
            Click a desktop icon to open a window — just like Windows 7.
          </p>
        )}

        {openWindows.has("profile") && (
          <ProfileWin7Window
            title={user?.name ?? "User Profile"}
            subtitle="Personal folder"
            icon={<HardDrive size={14} strokeWidth={2.5} />}
            className="profile-window-user"
            active={activeWindow === "profile"}
            onClose={() => closeWindow("profile")}
            onFocus={() => setActiveWindow("profile")}
          >
            <div className="flex flex-col sm:flex-row items-start gap-5 p-5">
              <button
                type="button"
                className={`dash-avatar w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 profile-avatar-btn ${avatarBounces ? "profile-avatar-bounce" : ""}`}
                onDoubleClick={handleAvatarDoubleClick}
              >
                {user ? getInitials(user.name) : "?"}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h2 className="text-lg font-bold dash-heading">{user?.name ?? "User"}</h2>
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
                    <Clock size={12} /> {user?.hoursAvailable.toFixed(1)} hrs free
                  </span>
                  <span className="profile-chip">
                    <Briefcase size={12} /> {listingStats.active} live listings
                  </span>
                </div>
              </div>
            </div>

            <div id="profile-stats" className="profile-stats-grid px-5 pb-5">
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
          </ProfileWin7Window>
        )}

        {openWindows.has("pending") && pending.length > 0 && (
          <ProfileWin7Window
            title="Awaiting Confirmation"
            subtitle={`${pending.length} pending`}
            icon={<Loader2 size={14} className="animate-spin" />}
            className="profile-window-pending"
            active={activeWindow === "pending"}
            onClose={() => closeWindow("pending")}
            onFocus={() => setActiveWindow("pending")}
          >
            <p className="px-5 pt-4 text-xs dash-subtext">
              Both people must confirm before hours are transferred.
            </p>
            <div className="divide-y dash-divider mt-2">
              {pending.map((ex) => {
                const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
                const userConfirmed = user ? hasUserConfirmed(ex, user.userId) : false;
                const partnerConfirmed = user ? isPartnerConfirmed(ex, user.userId) : false;
                return (
                  <div key={ex.id} className="flex flex-col gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dash-heading">{ex.title}</p>
                      <p className="text-xs dash-subtext">
                        with {partner.name} · {ex.hours}h
                        {ex.exchange_format ? ` · ${formatExchangeFormat(ex.exchange_format)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className={`dash-badge px-2 py-0.5 rounded-full ${userConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                        You {userConfirmed ? "confirmed" : "pending"}
                      </span>
                      <span className={`dash-badge px-2 py-0.5 rounded-full ${partnerConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                        {partner.name.split(" ")[0]} {partnerConfirmed ? "confirmed" : "pending"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
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
          </ProfileWin7Window>
        )}

        {error && openWindows.size > 0 && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
        )}

        {openWindows.has("ledger") && (
          <ProfileWin7Window
            title="Exchange Ledger"
            subtitle={tab}
            icon={<FolderOpen size={14} strokeWidth={2.5} />}
            className="profile-window-ledger"
            id="profile-ledger"
            active={activeWindow === "ledger"}
            onClose={() => closeWindow("ledger")}
            onFocus={() => setActiveWindow("ledger")}
          >
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
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm dash-subtext">
              No exchanges yet. Browse the Job Board to join one!
            </div>
          ) : (
            <div className="divide-y dash-divider max-h-80 overflow-y-auto">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/30 transition-colors">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dash-heading truncate">{item.task}</p>
                    <p className="text-xs dash-subtext">
                      {item.type === "given"
                        ? "Earned with"
                        : item.type === "received"
                          ? "Paid to"
                          : "Joined"}{" "}
                      {item.name} · {item.date}
                      {item.raw.exchange_format ? ` · ${formatExchangeFormat(item.raw.exchange_format)}` : ""}
                    </p>
                  </div>
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
          </ProfileWin7Window>
        )}
      </div>

      <div className="profile-taskbar">
        <button type="button" className="profile-start-btn" onClick={handleStartClick}>
          <Sun size={16} />
          <span>ChronoStart</span>
        </button>
        <div className="profile-taskbar-apps">
          {(["profile", "ledger", "pending"] as const).map((windowId) => {
            if (windowId === "pending" && pending.length === 0) return null;
            if (!openWindows.has(windowId)) return null;
            const isActive = activeWindow === windowId;
            return (
              <button
                key={windowId}
                type="button"
                className={`profile-taskbar-app ${isActive ? "profile-taskbar-app-active" : ""}`}
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
    </div>
  );
};
