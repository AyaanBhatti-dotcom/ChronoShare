import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";
import { setNewSignupTourPending } from "../../utils/onboarding";

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const err = await signup(name, email, password);
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    setNewSignupTourPending();
    navigate("/dashboard", { replace: true });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join ChronoShare and start trading time"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Sign in
          </Link>
        </>
      }
    >
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
          <label htmlFor="name" className="text-xs font-medium text-[#9CA3AF]">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B5563] outline-none transition-colors focus:border-emerald-500/50"
            style={{ background: "#111827", border: "1px solid #1F2937" }}
          />
        </div>

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

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium text-[#9CA3AF]">
            Password
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
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B5563] outline-none transition-colors focus:border-emerald-500/50"
            style={{ background: "#111827", border: "1px solid #1F2937" }}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-[#9CA3AF]">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
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
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
