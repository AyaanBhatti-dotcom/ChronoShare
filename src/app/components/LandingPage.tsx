import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, Navigate } from "react-router";
import { useTranslation } from "react-i18next";
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
import { LanguageSwitcher } from "./LanguageSwitcher";
import { aero } from "./onboarding/aeroTheme";

export function LandingPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  const features = useMemo(
    () => [
      {
        step: "01",
        accent: "aqua",
        tag: t("landing.features.exchange.tag"),
        icon: <Clock size={22} strokeWidth={2.25} />,
        title: t("landing.features.exchange.title"),
        desc: t("landing.features.exchange.desc"),
      },
      {
        step: "02",
        accent: "sky",
        tag: t("landing.features.discover.tag"),
        icon: <Briefcase size={22} strokeWidth={2.25} />,
        title: t("landing.features.discover.title"),
        desc: t("landing.features.discover.desc"),
      },
      {
        step: "03",
        accent: "grass",
        tag: t("landing.features.community.tag"),
        icon: <Users size={22} strokeWidth={2.25} />,
        title: t("landing.features.community.title"),
        desc: t("landing.features.community.desc"),
      },
      {
        step: "04",
        accent: "sun",
        tag: t("landing.features.trust.tag"),
        icon: <Shield size={22} strokeWidth={2.25} />,
        title: t("landing.features.trust.title"),
        desc: t("landing.features.trust.desc"),
      },
    ],
    [t],
  );

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
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="landing" />
            <Link
              to="/login"
              className="text-sm font-medium landing-body hover:text-[var(--landing-text)] transition-colors px-3 py-1.5"
            >
              {t("nav.logIn")}
            </Link>
            <Link to="/signup" className="landing-btn-primary text-sm !py-2 !px-4">
              {t("nav.getStarted")}
            </Link>
          </div>
        </div>
      </header>

      <div className="landing-hero-sticky">
        <MountainVistaParallax
          className="hero-container-landing"
          title={t("landing.heroTitle")}
          subtitle={t("landing.heroSubtitle")}
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
            aria-label={t("landing.scrollHint")}
          >
            <span className="landing-scroll-hint-inner">
              <span>{t("common.scroll")}</span>
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
                {t("landing.badge")}
              </div>
            </LandingReveal>

            <LandingReveal delay={120}>
              <p className="text-lg landing-body mb-10 max-w-xl mx-auto leading-relaxed">
                {t("landing.intro")}
              </p>
            </LandingReveal>

            <LandingReveal delay={240}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup" className="landing-btn-primary w-full sm:w-auto">
                  {t("landing.createAccount")}
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="landing-btn-secondary w-full sm:w-auto">
                  {t("landing.logInAccount")}
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
              <span className="landing-how-eyebrow">{t("landing.howEyebrow")}</span>
              <h2 className="landing-how-title">{t("landing.howTitle")}</h2>
              <p className="landing-body max-w-md mx-auto mt-3">
                {t("landing.howSubtitle")}
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
              <LandingReveal key={feature.step} delay={100 + index * 110}>
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
                {t("landing.ctaTitle")}
              </h2>
              <p className="landing-body mb-8 max-w-md mx-auto">
                {t("landing.ctaSubtitle")}
              </p>
              <Link to="/signup" className="landing-btn-primary">
                {t("landing.getStartedFree")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </LandingReveal>
        </section>

        <footer className="landing-footer-aero py-8">
          <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo size="xs" />
              <span className="text-xs landing-stat-label !mt-0">{t("landing.copyright")}</span>
            </div>
            <div className="flex gap-4 text-xs">
              <Link to="/login" className="landing-footer-link">
                {t("nav.logIn")}
              </Link>
              <Link to="/signup" className="landing-footer-link">
                {t("nav.signUp")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
