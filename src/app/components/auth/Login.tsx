import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getAuthenticatedHomePath } from "../../utils/auth-routes";
import { AuthLayout } from "./AuthLayout";

export function Login() {
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
      title="Welcome back"
      subtitle="Sign in to access your dashboard"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Sign up
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
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-medium text-[#9CA3AF]">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Forgot password?
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
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <Link
          to="/admin"
          className="block w-full rounded-xl py-2.5 text-sm font-medium text-center transition-colors hover:text-white"
          style={{ border: "1px solid #1F2937", color: "#9CA3AF" }}
        >
          Dev Admin
        </Link>
      </form>
    </AuthLayout>
  );
}
