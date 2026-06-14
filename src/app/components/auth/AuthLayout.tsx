import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "../Logo";
import { LanguageSwitcher } from "../LanguageSwitcher";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="auth-aero-page min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="auth-aero-scene" aria-hidden="true">
        <div className="auth-aero-sky" />
        <div className="auth-aero-sun" />
        <div className="auth-aero-ocean" />
        <div className="auth-aero-wave auth-aero-wave-1" />
        <div className="auth-aero-wave auth-aero-wave-2" />
        <div className="auth-aero-shimmer" />
        <div className="auth-aero-grass auth-aero-grass-back" />
        <div className="auth-aero-grass auth-aero-grass-front" />
        <div className="auth-aero-spark auth-aero-spark-1" />
        <div className="auth-aero-spark auth-aero-spark-2" />
        <div className="auth-aero-spark auth-aero-spark-3" />
      </div>

      <div className="auth-aero-content min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="auth-glass-strip auth-aero-brand flex flex-col items-center mb-8 text-center">
            <Logo size="md" className="mb-3 auth-aero-logo rounded-xl" />
            <Link to="/" className="text-lg font-extrabold auth-aero-brand-name tracking-tight hover:opacity-90">
              {t("common.appName")}
            </Link>
            <p className="text-sm auth-aero-brand-tag mt-1">{t("common.tagline")}</p>
            <div className="mt-4">
              <LanguageSwitcher variant="compact" />
            </div>
          </div>

          <div className="auth-glass-card">
            <div className="mb-6">
              <h1 className="text-xl font-bold auth-aero-title">{title}</h1>
              <p className="text-sm auth-aero-subtitle mt-1">{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="auth-glass-strip auth-aero-footer mt-6 text-center text-sm">{footer}</div>
        </div>
      </div>
    </div>
  );
}
