import { Clock } from "lucide-react";
import { Link } from "react-router";
import { aero } from "../onboarding/aeroTheme";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
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
          <div className="flex flex-col items-center mb-8 auth-aero-brand">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 auth-aero-logo"
              style={{ background: aero.gradientPrimary }}
            >
              <Clock size={22} style={{ color: aero.text }} />
            </div>
            <Link to="/" className="text-lg font-bold auth-aero-brand-name tracking-tight hover:opacity-90">
              ChronoShare
            </Link>
            <p className="text-xs auth-aero-brand-tag mt-1">Trade time, not money</p>
          </div>

          <div className="auth-glass-card">
            <div className="mb-6">
              <h1 className="text-xl font-bold auth-aero-title">{title}</h1>
              <p className="text-sm auth-aero-subtitle mt-1">{subtitle}</p>
            </div>
            {children}
          </div>

          <p className="text-center text-sm auth-aero-footer mt-6">{footer}</p>
        </div>
      </div>
    </div>
  );
}
