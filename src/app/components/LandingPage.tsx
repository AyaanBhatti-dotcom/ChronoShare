import { useEffect, useState, useCallback } from "react";
import { Link, Navigate } from "react-router";
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
import { getAuthenticatedHomePath } from "../utils/auth-routes";
import { MountainVistaParallax } from "./ui/mountain-vista-bg";
import { LandingReveal } from "./LandingReveal";
import { aero } from "./onboarding/aeroTheme";

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
  { value: "4.9", label: "Avg. rating", icon: <Star size={14} className="text-[#c47a12] fill-[#ffd166]" /> },
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
        className="min-h-screen flex items-center justify-center landing-aero"
        style={{ background: aero.gradientBg }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: aero.aquaDeep, borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (user) {
    return <Navigate to={getAuthenticatedHomePath(user)} replace />;
  }

  return (
    <div className="landing-aero min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header
        className={`landing-nav landing-nav-aero ${navScrolled ? "landing-nav-aero-scrolled" : ""}`}
      >
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: aero.gradientPrimary }}
            >
              <Clock size={18} style={{ color: aero.text }} />
            </div>
            <span className="text-sm font-semibold landing-heading tracking-tight">ChronoShare</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium landing-body hover:text-[var(--landing-text)] transition-colors px-3 py-1.5"
            >
              Log in
            </Link>
            <Link to="/signup" className="landing-btn-primary text-sm !py-2 !px-4">
              Get started
            </Link>
          </div>
        </div>
      </header>

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

      <div id="landing-content" className="landing-content landing-content-aero">
        <section className="relative max-w-6xl mx-auto px-5 pb-16 sm:pb-24">
          <div className="relative text-center max-w-3xl mx-auto">
            <LandingReveal>
              <div className="landing-badge mb-6">
                <Zap size={12} />
                The time economy, reimagined
              </div>
            </LandingReveal>

            <LandingReveal delay={120}>
              <p className="text-lg landing-body mb-10 max-w-xl mx-auto leading-relaxed">
                ChronoShare is a community platform where you trade time instead of money.
                Offer what you know, get what you need.
              </p>
            </LandingReveal>

            <LandingReveal delay={240}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup" className="landing-btn-primary w-full sm:w-auto">
                  Create free account
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="landing-btn-secondary w-full sm:w-auto">
                  Log in to your account
                </Link>
              </div>
            </LandingReveal>
          </div>

          <div className="relative grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16">
            {stats.map((stat, index) => (
              <LandingReveal key={stat.label} delay={320 + index * 100}>
                <div className="landing-glass landing-glass-stat text-center">
                  <p className="landing-stat-value flex items-center justify-center gap-1">
                    {stat.value}
                    {stat.icon}
                  </p>
                  <p className="landing-stat-label">{stat.label}</p>
                </div>
              </LandingReveal>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 pb-24">
          <LandingReveal>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl landing-heading mb-3">How it works</h2>
              <p className="landing-body max-w-md mx-auto">
                Join a growing community of people exchanging skills, one hour at a time.
              </p>
            </div>
          </LandingReveal>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <LandingReveal key={feature.title} delay={120 + index * 90}>
                <div className="landing-glass landing-glass-card h-full">
                  <div className="landing-icon-well mb-4">{feature.icon}</div>
                  <h3 className="text-base font-semibold landing-heading mb-2">{feature.title}</h3>
                  <p className="text-sm landing-body leading-relaxed">{feature.desc}</p>
                </div>
              </LandingReveal>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 pb-20">
          <LandingReveal delay={80}>
            <div className="landing-glass landing-glass-panel text-center">
              <h2 className="text-2xl sm:text-3xl landing-heading mb-3">
                Ready to start trading time?
              </h2>
              <p className="landing-body mb-8 max-w-md mx-auto">
                Sign up in seconds and access your personal dashboard, job board, and hour ledger.
              </p>
              <Link to="/signup" className="landing-btn-primary">
                Get started free
                <ArrowRight size={16} />
              </Link>
            </div>
          </LandingReveal>
        </section>

        <footer className="landing-footer-aero py-8">
          <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: aero.gradientPrimary }}
              >
                <Clock size={14} style={{ color: aero.text }} />
              </div>
              <span className="text-xs landing-stat-label !mt-0">© 2026 ChronoShare</span>
            </div>
            <div className="flex gap-4 text-xs">
              <Link to="/login" className="landing-footer-link">
                Log in
              </Link>
              <Link to="/signup" className="landing-footer-link">
                Sign up
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
