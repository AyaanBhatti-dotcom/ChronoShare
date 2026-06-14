import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Home, Briefcase, PlusCircle, User, Settings as SettingsIcon,
  Bell, Search, Menu, X, LogOut, HeartHandshake,
} from "lucide-react";
import { HomeDashboard } from "./HomeDashboard";
import { LogoBrand } from "./Logo";
import { JobBoard, type BoardTab } from "./JobBoard";
import { PostRequest } from "./PostRequest";
import { Profile } from "./Profile";
import { Settings } from "./Settings";
import { CommunityPool } from "./CommunityPool";
import { useAuth, getInitials } from "../context/AuthContext";
import { AeroBackground } from "./onboarding/aeroTheme";
import { OnboardingTour, type TourStep } from "./onboarding/OnboardingTour";
import { consumeNewSignupTour } from "../utils/onboarding";
import { fetchActivePostCount } from "../../lib/posts";
import { getStoredListingScope, storeListingScope, type ListingScope } from "../../lib/listing-scope";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { DashboardNavigateOptions } from "./dashboard-nav";

type Screen = "home" | "board" | "community" | "post" | "profile" | "settings";
type BoardMode = "all" | "needs" | "offers";

const navItemIds: { id: Screen; labelKey: string; shortKey: string; icon: React.ReactNode }[] = [
  { id: "home", labelKey: "nav.home", shortKey: "nav.home", icon: <Home size={18} /> },
  { id: "board", labelKey: "nav.board", shortKey: "nav.boardShort", icon: <Briefcase size={18} /> },
  { id: "community", labelKey: "nav.community", shortKey: "nav.communityShort", icon: <HeartHandshake size={18} /> },
  { id: "post", labelKey: "nav.post", shortKey: "nav.postShort", icon: <PlusCircle size={18} /> },
  { id: "profile", labelKey: "nav.profile", shortKey: "nav.profile", icon: <User size={18} /> },
  { id: "settings", labelKey: "nav.settings", shortKey: "nav.settings", icon: <SettingsIcon size={18} /> },
];

const pageTitleKeys: Record<Screen, string> = {
  home: "pages.dashboard",
  board: "pages.jobBoard",
  community: "pages.communityPool",
  post: "pages.postRequest",
  profile: "pages.myProfile",
  settings: "pages.settings",
};

export function DashboardLayout({
  previewMode = false,
  onExitPreview,
}: {
  previewMode?: boolean;
  onExitPreview?: () => void;
} = {}) {
  const { t } = useTranslation();
  const { user, logout, completeOnboarding, resetOnboarding } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [postType, setPostType] = useState<"needs" | "offers">("needs");
  const [boardMode, setBoardMode] = useState<BoardMode>("all");
  const [boardTab, setBoardTab] = useState<BoardTab>("open");
  const [boardPostId, setBoardPostId] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const initials = user ? getInitials(user.name) : "?";
  const firstName = user?.name.split(" ")[0] ?? "there";

  const navigateScreen = useCallback((s: string, options?: DashboardNavigateOptions) => {
    if (options?.postType) {
      setPostType(options.postType);
    } else if (s === "post") {
      setPostType("needs");
    }
    if (options?.boardMode) {
      setBoardMode(options.boardMode);
    } else if (s === "board") {
      setBoardMode("all");
    }
    if (options?.boardTab) {
      setBoardTab(options.boardTab);
    } else if (s === "board") {
      setBoardTab("open");
    }
    if (options?.listingScope) {
      storeListingScope(options.listingScope, "board");
    }
    if (options?.postId) {
      setBoardPostId(options.postId);
    } else if (s === "board") {
      setBoardPostId(null);
    }
    setScreen(s as Screen);
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    fetchActivePostCount().then(setJobCount).catch(() => setJobCount(0));
  }, [screen]);

  const sidebarStep = useCallback((screen: Screen = "home") => {
    setScreen(screen);
    if (window.matchMedia("(max-width: 639px)").matches) {
      setMobileOpen(true);
    }
  }, []);

  const startTour = useCallback(() => {
    setShowTour(false);
    setScreen("home");
    setMobileOpen(false);
    window.setTimeout(() => {
      setTourKey((k) => k + 1);
      setShowTour(true);
    }, 250);
  }, []);

  useEffect(() => {
    if (previewMode || !user) return;
    if (consumeNewSignupTour()) startTour();
  }, [user, previewMode, startTour]);

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        title: t("tour.welcome", { name: firstName }),
        description: t("tour.welcomeDesc"),
      },
      {
        title: t("tour.hoursTitle"),
        description: t("tour.hoursDesc"),
      },
      {
        target: '[data-tour="nav-home"]',
        title: t("tour.homeTitle"),
        description: t("tour.homeDesc"),
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="hour-balance"]',
        title: t("tour.balanceTitle"),
        description: t("tour.balanceDesc"),
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="quick-actions"]',
        title: t("tour.quickTitle"),
        description: t("tour.quickDesc"),
        position: "bottom",
        onEnter: () => {
          setScreen("home");
          setMobileOpen(false);
        },
      },
      {
        target: '[data-tour="nav-board"]',
        title: t("tour.boardTitle"),
        description: t("tour.boardDesc"),
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="nav-community"]',
        title: t("tour.poolTitle"),
        description: t("tour.poolDesc"),
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="nav-post"]',
        title: t("tour.postTitle"),
        description: t("tour.postDesc"),
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="nav-profile"]',
        title: t("tour.profileTitle"),
        description: t("tour.profileDesc"),
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="header-search"]',
        title: t("tour.searchTitle"),
        description: t("tour.searchDesc"),
        position: "bottom",
        onEnter: () => {
          setScreen("home");
          setMobileOpen(false);
        },
      },
      {
        title: t("tour.readyTitle"),
        description: t("tour.readyDesc"),
      },
    ],
    [firstName, sidebarStep, t],
  );

  const handleTourComplete = useCallback(async () => {
    setShowTour(false);
    if (user && !user.onboardingCompleted) {
      await completeOnboarding();
    }
  }, [user, completeOnboarding]);

  const handleRestartOnboarding = useCallback(async () => {
    const err = await resetOnboarding();
    if (!err) startTour();
  }, [resetOnboarding, startTour]);

  const handleLogout = async () => {
    if (previewMode) {
      onExitPreview?.();
      return;
    }
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      className={`dashboard-aero relative overflow-hidden ${previewMode ? "h-full" : "h-screen max-sm:h-dvh"}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <AeroBackground />

      <div className={`relative z-10 flex min-h-0 overflow-hidden ${previewMode ? "h-full" : "h-screen max-sm:h-dvh"}`}>
      {/* Sidebar */}
      <aside
        className={`dash-glass-sidebar dash-liquid-surface fixed inset-y-0 left-0 z-40 flex flex-col w-60 border-r transition-transform duration-300 sm:relative sm:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onTransitionEnd={(e) => {
          if (e.propertyName === "transform") {
            window.dispatchEvent(new CustomEvent("tour-layout-change"));
          }
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b dash-divider">
          <LogoBrand size="xs" nameClassName="dash-heading" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItemIds.map((item) => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                data-tour={`nav-${item.id}`}
                onClick={() => navigateScreen(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active ? "dash-nav-active" : "dash-nav-inactive"
                }`}
              >
                {item.icon}
                {t(item.labelKey)}
                {item.id === "board" && jobCount > 0 && (
                  <span className="dash-badge ml-auto text-xs px-1.5 py-0.5 rounded-full">
                    {jobCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User mini */}
        <div className="px-3 py-4 border-t dash-divider space-y-1">
          <button
            onClick={() => navigateScreen("profile")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/30 transition-colors"
          >
            <div className="dash-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="text-left min-w-0" data-tour="hour-balance">
              <p className="text-xs font-medium dash-heading truncate">{user?.name}</p>
              <p className="text-xs dash-subtext truncate">
                {t("common.hrsAvailable", { count: user?.hoursAvailable.toFixed(1) })}
              </p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs dash-subtext hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            {previewMode ? t("nav.exitPreview") : t("nav.signOut")}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 dash-modal-overlay sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Header */}
        <header className="dash-glass-header dash-liquid-surface dash-mobile-header flex items-center gap-4 px-5 py-3.5 border-b flex-shrink-0">
          <button
            className="sm:hidden dash-subtext hover:dash-heading transition-colors flex-shrink-0"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 className="text-sm font-bold dash-page-title dash-mobile-header-title">{t(pageTitleKeys[screen])}</h1>

          <div
            className="dash-search hidden sm:flex flex-1 max-w-xs ml-4 items-center gap-2 px-3 py-1.5 rounded-xl"
            data-tour="header-search"
          >
            <Search size={13} className="dash-subtext" />
            <input
              placeholder={t("nav.searchPlaceholder")}
              className="bg-transparent text-xs dash-heading placeholder:text-[var(--dash-text-faint)] outline-none w-full"
            />
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcher variant="compact" />
            <button
              className="sm:hidden relative dash-subtext hover:dash-heading transition-colors p-1"
              data-tour="header-search"
              aria-label={t("nav.search")}
              onClick={() => navigateScreen("board")}
            >
              <Search size={18} />
            </button>
            <button className="relative dash-subtext hover:dash-heading transition-colors p-1">
              <Bell size={18} />
              {notifications > 0 && (
                <span className="dash-btn-primary absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold">
                  {notifications}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateScreen("profile")}
              className="dash-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-5 sm:px-8 py-6 max-sm:py-0 dash-mobile-main">
          {screen === "home" && <HomeDashboard onNavigate={navigateScreen} />}
          {screen === "board" && (
            <JobBoard
              initialMode={boardMode}
              initialTab={boardTab}
              initialPostId={boardPostId}
              onInitialPostHandled={() => setBoardPostId(null)}
              onNavigate={navigateScreen}
            />
          )}
          {screen === "community" && <CommunityPool onNavigate={navigateScreen} />}
          {screen === "post" && (
            <PostRequest initialPostType={postType} onNavigate={navigateScreen} />
          )}
          {screen === "profile" && <Profile onNavigate={navigateScreen} />}
          {screen === "settings" && (
            <Settings
              onLogout={handleLogout}
              onRestartOnboarding={handleRestartOnboarding}
            />
          )}
        </main>
      </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="dash-mobile-bottom-nav sm:hidden" aria-label={t("nav.home")}>
        {navItemIds.map((item) => {
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              data-tour={`nav-${item.id}`}
              onClick={() => navigateScreen(item.id)}
              className={`dash-mobile-nav-item relative ${active ? "dash-mobile-nav-item-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              {item.icon}
              <span className="truncate max-w-full">{t(item.shortKey)}</span>
              {item.id === "board" && jobCount > 0 && (
                <span className="dash-mobile-nav-badge">{jobCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {showTour && !previewMode && (
        <OnboardingTour
          key={tourKey}
          steps={tourSteps}
          onComplete={handleTourComplete}
          onSkip={handleTourComplete}
        />
      )}
    </div>
  );
}
