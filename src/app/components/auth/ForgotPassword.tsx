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
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Sign in
          </Link>
        </>
      }
    >
      {success ? (
        <div
          className="rounded-xl px-4 py-4 text-sm text-emerald-400 border space-y-3"
          style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.2)" }}
        >
          <p>Check your inbox — we sent a password reset link to <strong className="text-white">{email}</strong>.</p>
          <Link
            to="/login"
            className="inline-block text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm text-red-400 border"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}
            >
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-[#9CA3AF]">
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
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B5563] outline-none transition-colors focus:border-emerald-500/50"
              style={{ background: "#111827", border: "1px solid #1F2937" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #10B981, #06B6D4)",
              color: "#000",
            }}
          >
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
