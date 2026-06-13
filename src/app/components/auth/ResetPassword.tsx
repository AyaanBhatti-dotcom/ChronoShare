import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import {
  INSECURE_PASSWORD_MESSAGE,
  isPasswordInRockyou,
  preloadRockyouSet,
} from "../../../lib/password-leak-check";
import { AuthLayout } from "./AuthLayout";

export function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordInsecure, setPasswordInsecure] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    preloadRockyouSet();
  }, []);

  useEffect(() => {
    if (!password) {
      setPasswordInsecure(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setCheckingPassword(true);
      try {
        const insecure = await isPasswordInRockyou(password);
        if (!cancelled) setPasswordInsecure(insecure);
      } catch {
        if (!cancelled) setPasswordInsecure(false);
      } finally {
        if (!cancelled) setCheckingPassword(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordInsecure) {
      setError(INSECURE_PASSWORD_MESSAGE);
      return;
    }

    setLoading(true);
    const err = await updatePassword(password);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <AuthLayout
      title="Set a new password"
      subtitle="Choose a strong password for your account"
      footer={
        <Link to="/login" className="auth-link">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="auth-alert-error">{error}</div>}

        <div className="space-y-1.5">
          <label htmlFor="password" className="auth-label">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="auth-input"
          />
          {passwordInsecure && (
            <p className="text-xs text-red-700">{INSECURE_PASSWORD_MESSAGE}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="auth-label">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="auth-input"
          />
        </div>

        <button
          type="submit"
          disabled={loading || checkingPassword || passwordInsecure}
          className="auth-btn-primary"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
