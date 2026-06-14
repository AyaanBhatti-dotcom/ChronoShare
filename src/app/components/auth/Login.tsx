import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { getAuthenticatedHomePath } from "../../utils/auth-routes";
import { AuthLayout } from "./AuthLayout";

export function Login() {
  const { t } = useTranslation();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pendingRedirect = useRef(false);

  useEffect(() => {
    if (!pendingRedirect.current || !user) return;
    pendingRedirect.current = false;
    navigate(getAuthenticatedHomePath(user), { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const err = await login(email, password);
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    pendingRedirect.current = true;
    setLoading(false);
  };

  return (
    <AuthLayout
      title={t("auth.welcomeBack")}
      subtitle={t("auth.signInSubtitle")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link to="/signup" className="auth-link">
            {t("nav.signUp")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="auth-alert-error">{error}</div>}

        <div className="space-y-1.5">
          <label htmlFor="email" className="auth-label">
            {t("auth.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            className="auth-input"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="auth-label">
              {t("auth.password")}
            </label>
            <Link to="/forgot-password" className="text-xs auth-link">
              {t("auth.forgotPassword")}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="auth-input"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? t("auth.signingIn") : t("auth.signIn")}
        </button>

        <Link to="/admin" className="auth-btn-secondary">
          {t("auth.devAdmin")}
        </Link>
      </form>
    </AuthLayout>
  );
}
