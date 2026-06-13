import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const err = await resetPassword(email);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    setSuccess(true);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <>
          Remember your password?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </>
      }
    >
      {success ? (
        <div className="auth-alert-success space-y-3">
          <p>
            Check your inbox — we sent a password reset link to{" "}
            <strong className="auth-aero-title">{email}</strong>.
          </p>
          <Link to="/login" className="auth-link">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="auth-alert-error">{error}</div>}

          <div className="space-y-1.5">
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="auth-input"
            />
          </div>

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
