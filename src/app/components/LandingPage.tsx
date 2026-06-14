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
import { Logo, LogoBrand } from "./Logo";
import { aero } from "./onboarding/aeroTheme";

const features = [
  {
    step: "01",
    accent: "aqua",
    tag: "The exchange",
    icon: <Clock size={22} strokeWidth={2.25} />,
    title: "Trade time, not money",
    desc: "Exchange skills and services using hours instead of cash. Everyone's time has equal value.",
  },
  {
    step: "02",
    accent: "sky",
    tag: "Discover",
    icon: <Briefcase size={22} strokeWidth={2.25} />,
    title: "Post & discover requests",
    desc: "Browse the job board or post what you need — from tutoring to home repairs.",
  },
  {
    step: "03",
    accent: "grass",
    tag: "Community",
    icon: <Users size={22} strokeWidth={2.25} />,
    title: "Community-driven",
    desc: "Connect with verified members, build your reputation, and grow your hour balance.",
  },
  {
    step: "04",
    accent: "sun",
    tag: "Trust",
    icon: <Shield size={22} strokeWidth={2.25} />,
    title: "Trusted exchanges",
    desc: "Track every transaction on your ledger with ratings and verified identity.",
  },
] as const;

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
          <Link to="/" className="hover:opacity-90 transition-opacity">
            <LogoBrand size="sm" nameClassName="landing-heading" />
          </Link>
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
        </section>

        <section className="landing-how-section max-w-6xl mx-auto px-5 pb-24">
          <div className="landing-how-atmosphere" aria-hidden="true">
            <div className="landing-how-orb landing-how-orb-sun" />
            <div className="landing-how-orb landing-how-orb-aqua" />
            <div className="landing-how-orb landing-how-orb-grass" />
            <div className="landing-how-ring" />
          </div>

          <LandingReveal>
            <div className="landing-how-header text-center mb-14 sm:mb-16">
              <span className="landing-how-eyebrow">Simple · Local · Human</span>
              <h2 className="landing-how-title">How it works</h2>
              <p className="landing-body max-w-md mx-auto mt-3">
                Join a growing community of people exchanging skills, one hour at a time.
              </p>
              <div className="landing-how-divider" aria-hidden="true">
                <span />
                <Star size={14} className="landing-how-divider-star" />
                <span />
              </div>
            </div>
          </LandingReveal>

          <div className="landing-feature-grid">
            {features.map((feature, index) => (
              <LandingReveal key={feature.title} delay={100 + index * 110}>
                <article
                  className={`landing-glass landing-feature-card landing-feature-${feature.accent}`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="landing-feature-card-top">
                    <span className="landing-feature-step">{feature.step}</span>
                    <div className="landing-feature-icon">{feature.icon}</div>
                  </div>
                  <span className="landing-feature-tag">{feature.tag}</span>
                  <h3 className="landing-feature-title">{feature.title}</h3>
                  <p className="landing-feature-desc">{feature.desc}</p>
                  <div className="landing-feature-accent-bar" aria-hidden="true" />
                </article>
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
              <Logo size="xs" />
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
