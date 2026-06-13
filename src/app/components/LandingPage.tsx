import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import {
  Clock,
  ArrowRight,
  Users,
  Shield,
  Zap,
  Briefcase,
  Star,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MountainVistaParallax } from "./ui/mountain-vista-bg";

const features = [
  {
    icon: <Clock size={20} />,
    title: "Trade time, not money",
    desc: "Exchange skills and services using hours instead of cash. Everyone's time has equal value.",
  },
  {
    icon: <Briefcase size={20} />,
    title: "Post & discover requests",
    desc: "Browse the job board or post what you need — from tutoring to home repairs.",
  },
  {
    icon: <Users size={20} />,
    title: "Community-driven",
    desc: "Connect with verified members, build your reputation, and grow your hour balance.",
  },
  {
    icon: <Shield size={20} />,
    title: "Trusted exchanges",
    desc: "Track every transaction on your ledger with ratings and verified identity.",
  },
];

const stats = [
  { value: "2,400+", label: "Active members" },
  { value: "18k", label: "Hours exchanged" },
  { value: "4.9", label: "Avg. rating", icon: <Star size={14} className="text-amber-400 fill-amber-400" /> },
];

export function LandingPage() {
  const { user, isLoading } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      const progress = Math.min(Math.max(window.scrollY / vh, 0), 1);
      setScrollProgress(progress);
      setNavScrolled(window.scrollY > 48);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToContent = useCallback(() => {
    document.getElementById("landing-content")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0B0F19" }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!user;
  const canEnterDashboard = user?.profileSetupCompleted ?? false;

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#0B0F19", fontFamily: "'Inter', sans-serif" }}
    >
      {/* Nav — fixed over full-screen hero */}
      <header className={`landing-nav ${navScrolled ? "landing-nav-scrolled" : ""}`}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
            >
              <Clock size={18} style={{ color: "#000" }} />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">ChronoShare</span>
          </div>
          <div className="flex items-center gap-3">
            {canEnterDashboard ? (
              <Link
                to="/dashboard"
                className="text-sm font-semibold px-4 py-2 rounded-xl text-[#0B0F19] transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
              >
                Go to dashboard
              </Link>
            ) : isLoggedIn ? (
              <Link
                to="/signup"
                className="text-sm font-semibold px-4 py-2 rounded-xl text-[#0B0F19] transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
              >
                Continue setup
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-white/85 hover:text-white transition-colors px-3 py-1.5"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="text-sm font-semibold px-4 py-2 rounded-xl text-[#0B0F19] transition-all hover:brightness-110 hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Full-screen sticky hero */}
      <div className="landing-hero-sticky">
        <MountainVistaParallax
          className="hero-container-landing"
          title="Share your skills. Earn hours."
          subtitle="Trade time, not money — join a community where every hour counts"
          scrollProgress={scrollProgress}
        >
          <button
            type="button"
            onClick={scrollToContent}
            className="landing-scroll-hint"
            style={{
              opacity: 1 - scrollProgress * 2,
              pointerEvents: scrollProgress > 0.4 ? "none" : "auto",
            }}
            aria-label="Scroll to learn more"
          >
            <span className="landing-scroll-hint-inner">
              <span>Scroll</span>
              <ChevronDown size={18} />
            </span>
          </button>
        </MountainVistaParallax>
      </div>

      {/* Content slides up with rounded transition */}
      <div id="landing-content" className="landing-content">
        <section className="relative max-w-6xl mx-auto px-5 pb-16 sm:pb-24">
          <div className="relative text-center max-w-3xl mx-auto">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
              style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)", color: "#10B981" }}
            >
              <Zap size={12} />
              The time economy, reimagined
            </div>
            <p className="text-lg text-[#9CA3AF] mb-10 max-w-xl mx-auto leading-relaxed">
              ChronoShare is a community platform where you trade time instead of money.
              Offer what you know, get what you need.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {canEnterDashboard ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
                  style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                >
                  Open your dashboard
                  <ArrowRight size={16} />
                </Link>
              ) : isLoggedIn ? (
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
                  style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                >
                  Continue account setup
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 w-full sm:w-auto justify-center"
                    style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                  >
                    Create free account
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white border transition-colors hover:bg-white/[0.04] w-full sm:w-auto justify-center"
                    style={{ borderColor: "#1F2937" }}
                  >
                    Log in to your account
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center rounded-2xl py-4 px-3 border"
                style={{ background: "#111827", borderColor: "#1F2937" }}
              >
                <p className="text-xl sm:text-2xl font-semibold text-white flex items-center justify-center gap-1">
                  {stat.value}
                  {stat.icon}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-[#9CA3AF] max-w-md mx-auto">
              Join a growing community of people exchanging skills, one hour at a time.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl p-6 border transition-colors hover:border-emerald-500/20"
                style={{ background: "#111827", borderColor: "#1F2937" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-emerald-400"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 pb-20">
          <div
            className="rounded-3xl p-10 sm:p-14 text-center border relative overflow-hidden"
            style={{ background: "#0D1220", borderColor: "#1F2937" }}
          >
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at top, rgba(16,185,129,0.15), transparent 60%)" }}
            />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to start trading time?
              </h2>
              <p className="text-[#9CA3AF] mb-8 max-w-md mx-auto">
                Sign up in seconds and access your personal dashboard, job board, and hour ledger.
              </p>
              <Link
                to={canEnterDashboard ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
              >
                {canEnterDashboard
                  ? "Go to your dashboard"
                  : isLoggedIn
                    ? "Finish setting up your account"
                    : "Get started free"}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t py-8" style={{ borderColor: "#1F2937" }}>
          <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
              >
                <Clock size={14} style={{ color: "#000" }} />
              </div>
              <span className="text-xs text-[#9CA3AF]">© 2026 ChronoShare</span>
            </div>
            <div className="flex gap-4 text-xs text-[#9CA3AF]">
              {canEnterDashboard ? (
                <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="hover:text-white transition-colors">Log in</Link>
                  <Link to="/signup" className="hover:text-white transition-colors">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
