import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
import { ShaderBackground } from "./ui/shader-background";
import { OnboardingTour, type TourStep } from "./onboarding/OnboardingTour";

type Screen = "home" | "board" | "post" | "profile" | "settings";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [screen, setScreen] = useState<Screen>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications] = useState(3);
  const [showTour, setShowTour] = useState(false);

  const initials = user ? getInitials(user.name) : "?";

  const navigateScreen = useCallback((s: string) => {
    setScreen(s as Screen);
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    if (searchParams.get("tour") === "1") {
      setShowTour(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const tourSteps: TourStep[] = useMemo(
    () => [
      {
        target: '[data-tour="nav-home"]',
        title: "Your dashboard",
        description:
          "Home is your command center. See your hour balance, earned vs. spent charts, and recent exchanges all in one place.",
        position: "right",
        onEnter: () => navigateScreen("home"),
      },
      {
        target: '[data-tour="hour-balance"]',
        title: "Your time bank",
        description:
          "This is your available hour balance. Earn hours by helping others, spend them when you need help. It's always visible in the sidebar.",
        position: "right",
      },
      {
        target: '[data-tour="quick-actions"]',
        title: "Quick actions",
        description:
          "Use these buttons to quickly offer your skills or request help from the community. Both take you to the Post Request screen.",
        position: "bottom",
        onEnter: () => navigateScreen("home"),
      },
      {
        target: '[data-tour="nav-board"]',
        title: "Job Board",
        description:
          "Browse active posts from the community. Find people offering skills you need, or see who's looking for help you can provide.",
        position: "right",
        onEnter: () => navigateScreen("home"),
      },
      {
        target: '[data-tour="nav-post"]',
        title: "Post a request",
        description:
          "Create a new listing — offer your skills to earn hours, or post what you need and how many hours you're willing to spend.",
        position: "right",
      },
      {
        target: '[data-tour="nav-profile"]',
        title: "Your profile",
        description:
          "Track your exchange history, view your public profile, and see how the community rates your contributions.",
        position: "right",
      },
      {
        target: '[data-tour="header-search"]',
        title: "Search",
        description:
          "Search for people, tasks, and skills across the platform. Use it to quickly find the right exchange partner.",
        position: "bottom",
        onEnter: () => navigateScreen("home"),
      },
    ],
    [navigateScreen],
  );

  const handleTourComplete = () => setShowTour(false);
  const handleStartTour = () => {
    setScreen("home");
    setShowTour(true);
  };

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
      className={`relative overflow-hidden ${previewMode ? "h-full" : "h-screen"}`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <ShaderBackground />

      <div className={`relative z-10 flex overflow-hidden ${previewMode ? "h-full" : "h-screen"}`}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-60 border-r transition-transform duration-300 sm:relative sm:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#0D1220", borderColor: "#1F2937" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: "#1F2937" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
          >
            <Clock size={16} style={{ color: "#000" }} />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">ChronoShare</span>
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
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: active ? "rgba(16,185,129,0.12)" : "transparent",
                  color: active ? "#10B981" : "#9CA3AF",
                  border: active ? "1px solid rgba(16,185,129,0.2)" : "1px solid transparent",
                }}
              >
                {item.icon}
                {item.label}
                {item.id === "board" && (
                  <span
                    className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                  >
                    12
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User mini */}
        <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: "#1F2937" }}>
          <button
            onClick={() => navigateScreen("profile")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
            >
              {initials}
            </div>
            <div className="text-left min-w-0" data-tour="hour-balance">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{user?.hoursAvailable.toFixed(1)} hrs available</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={14} />
            {previewMode ? "Exit preview" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center gap-4 px-5 py-3.5 border-b flex-shrink-0"
          style={{ background: "#0D1220", borderColor: "#1F2937" }}
        >
          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-[#9CA3AF] hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 className="text-sm font-semibold text-white">{pageTitles[screen]}</h1>

          {/* Search */}
          <div
            className="flex-1 max-w-xs ml-4 flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: "#111827", border: "1px solid #1F2937" }}
            data-tour="header-search"
          >
            <Search size={13} className="text-[#9CA3AF]" />
            <input
              placeholder="Search people, tasks..."
              className="bg-transparent text-xs text-white placeholder-[#4B5563] outline-none w-full"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications */}
            <button className="relative text-[#9CA3AF] hover:text-white transition-colors">
              <Bell size={18} />
              {notifications > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-semibold"
                  style={{ background: "#10B981", color: "#000" }}
                >
                  {notifications}
                </span>
              )}
            </button>

            {/* Avatar */}
            <button
              onClick={() => navigateScreen("profile")}
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {screen === "home" && <HomeDashboard onNavigate={navigateScreen} />}
          {screen === "board" && <JobBoard />}
          {screen === "post" && <PostRequest />}
          {screen === "profile" && <Profile />}
          {screen === "settings" && <Settings onLogout={handleLogout} onStartTour={handleStartTour} />}
        </main>
      </div>
      </div>

      {showTour && !previewMode && (
        <OnboardingTour
          steps={tourSteps}
          onComplete={handleTourComplete}
          onSkip={handleTourComplete}
        />
      )}
    </div>
  );
}
