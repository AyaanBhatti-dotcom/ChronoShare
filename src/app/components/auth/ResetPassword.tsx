import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { AuthLayout } from "./AuthLayout";

export function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
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
        <>
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
            Back to sign in
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
          <label htmlFor="password" className="text-xs font-medium text-[#9CA3AF]">
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
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#4B5563] outline-none transition-colors focus:border-emerald-500/50"
            style={{ background: "#111827", border: "1px solid #1F2937" }}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-[#9CA3AF]">
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
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </AuthLayout>
  );
}
