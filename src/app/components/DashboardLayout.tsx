import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Home, Briefcase, PlusCircle, User, Settings as SettingsIcon,
  Clock, Bell, Search, Menu, X, LogOut,
} from "lucide-react";
import { HomeDashboard } from "./HomeDashboard";
import { JobBoard } from "./JobBoard";
import { PostRequest } from "./PostRequest";
import { Profile } from "./Profile";
import { Settings } from "./Settings";
import { useAuth, getInitials } from "../context/AuthContext";
import { AeroBackground } from "./onboarding/aeroTheme";
import { OnboardingTour, type TourStep } from "./onboarding/OnboardingTour";
import { consumeNewSignupTour } from "../utils/onboarding";
import { fetchActivePostCount } from "../../lib/posts";

type Screen = "home" | "board" | "post" | "profile" | "settings";
type BoardMode = "all" | "needs" | "offers";

type NavigateOptions = {
  postType?: "needs" | "offers";
  boardMode?: BoardMode;
};

const navItems: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <Home size={18} /> },
  { id: "board", label: "Job Board", icon: <Briefcase size={18} /> },
  { id: "post", label: "Post Request", icon: <PlusCircle size={18} /> },
  { id: "profile", label: "Profile", icon: <User size={18} /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];

const pageTitles: Record<Screen, string> = {
  home: "Dashboard",
  board: "Job Board",
  post: "Post a Request",
  profile: "My Profile",
  settings: "Settings",
};

export function DashboardLayout({
  previewMode = false,
  onExitPreview,
}: {
  previewMode?: boolean;
  onExitPreview?: () => void;
} = {}) {
  const { user, logout, completeOnboarding, resetOnboarding } = useAuth();
  const navigate = useNavigate();
  const [screen, setScreen] = useState<Screen>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications] = useState(0);
  const [jobCount, setJobCount] = useState(0);
  const [postType, setPostType] = useState<"needs" | "offers">("needs");
  const [boardMode, setBoardMode] = useState<BoardMode>("all");
  const [showTour, setShowTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const initials = user ? getInitials(user.name) : "?";
  const firstName = user?.name.split(" ")[0] ?? "there";

  const navigateScreen = useCallback((s: string, options?: NavigateOptions) => {
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
        title: `Welcome, ${firstName}!`,
        description:
          "ChronoShare lets you trade skills using hours, not money. This quick tour will show you around your dashboard.",
      },
      {
        title: "How time banking works",
        description:
          "Offer your skills to earn hours, browse the Job Board when you need help, and track your balance right here. Everyone starts with 1 hour.",
      },
      {
        target: '[data-tour="nav-home"]',
        title: "Your dashboard",
        description:
          "Home is your command center — hour balance, charts, and recent exchanges all in one place.",
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="hour-balance"]',
        title: "Your time bank",
        description:
          "Your available hours are always shown here in the sidebar. Earn hours by helping others, spend them when you need help.",
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="quick-actions"]',
        title: "Quick actions",
        description:
          "Offer your skills or request help from the community. Both buttons take you to Post Request.",
        position: "bottom",
        onEnter: () => {
          setScreen("home");
          setMobileOpen(false);
        },
      },
      {
        target: '[data-tour="nav-board"]',
        title: "Job Board",
        description:
          "Browse active posts — find people offering skills you need, or see who's looking for help you can provide.",
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="nav-post"]',
        title: "Post a request",
        description:
          "Create a listing to offer your skills or request help. Set how many hours each exchange is worth.",
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="nav-profile"]',
        title: "Your profile",
        description:
          "View your exchange history, public profile, and community ratings.",
        position: "right",
        onEnter: () => sidebarStep("home"),
      },
      {
        target: '[data-tour="header-search"]',
        title: "Search",
        description:
          "Search for people, tasks, and skills across the platform.",
        position: "bottom",
        onEnter: () => {
          setScreen("home");
          setMobileOpen(false);
        },
      },
      {
        title: "You're ready to go!",
        description:
          "That's everything you need to get started. Browse the Job Board or post your first offer — happy trading!",
      },
    ],
    [firstName, navigateScreen, sidebarStep],
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
      className={`dashboard-aero relative overflow-hidden ${previewMode ? "h-full" : "h-screen"}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <AeroBackground />

      <div className={`relative z-10 flex overflow-hidden ${previewMode ? "h-full" : "h-screen"}`}>
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
          <div className="dash-avatar w-8 h-8 rounded-xl flex items-center justify-center">
            <Clock size={16} />
          </div>
          <span className="text-sm font-semibold dash-heading tracking-tight">ChronoShare</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
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
                {item.label}
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
              <p className="text-xs dash-subtext truncate">{user?.hoursAvailable.toFixed(1)} hrs available</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs dash-subtext hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
            {previewMode ? "Exit preview" : "Sign out"}
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="dash-glass-header dash-liquid-surface flex items-center gap-4 px-5 py-3.5 border-b flex-shrink-0">
          <button
            className="sm:hidden dash-subtext hover:dash-heading transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 className="text-sm font-bold dash-page-title">{pageTitles[screen]}</h1>

          <div
            className="dash-search flex-1 max-w-xs ml-4 flex items-center gap-2 px-3 py-1.5 rounded-xl"
            data-tour="header-search"
          >
            <Search size={13} className="dash-subtext" />
            <input
              placeholder="Search people, tasks..."
              className="bg-transparent text-xs dash-heading placeholder:text-[var(--dash-text-faint)] outline-none w-full"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button className="relative dash-subtext hover:dash-heading transition-colors">
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
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {screen === "home" && <HomeDashboard onNavigate={navigateScreen} />}
          {screen === "board" && (
            <JobBoard initialMode={boardMode} onNavigate={navigateScreen} />
          )}
          {screen === "post" && (
            <PostRequest initialPostType={postType} onNavigate={navigateScreen} />
          )}
          {screen === "profile" && <Profile />}
          {screen === "settings" && (
            <Settings
              onLogout={handleLogout}
              onRestartOnboarding={handleRestartOnboarding}
            />
          )}
        </main>
      </div>
      </div>

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
