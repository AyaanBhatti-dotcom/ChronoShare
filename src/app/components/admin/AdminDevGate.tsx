import { useState } from "react";
import { Shield, KeyRound, ArrowRight } from "lucide-react";
import { verifyAdminKey } from "../../../lib/admin";
import { Logo } from "../Logo";

interface AdminDevGateProps {
  onAccessGranted: (key: string) => void;
}

export function AdminDevGate({ onAccessGranted }: AdminDevGateProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmed = key.trim();
    if (!trimmed) {
      setError("Enter the dev admin key.");
      setLoading(false);
      return;
    }

    const valid = await verifyAdminKey(trimmed);
    if (!valid) {
      setError("Invalid admin key.");
      setLoading(false);
      return;
    }

    onAccessGranted(trimmed);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0B0F19" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 border"
        style={{ background: "#111827", borderColor: "#1F2937" }}
      >
        <div className="flex flex-col items-center text-center mb-8">
          <Logo variant="minimal" size="md" className="mb-4" />
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <Shield size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Admin Dashboard</h1>
          <p className="text-sm text-[#9CA3AF]">
            Dev access only. Enter the admin key to view users and community posts without signing in.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
              Dev Admin Key
            </label>
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl"
              style={{ background: "#0B0F19", border: "1px solid #1F2937" }}
            >
              <KeyRound size={16} className="text-[#9CA3AF] flex-shrink-0" />
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter dev key"
                className="bg-transparent text-sm text-white placeholder-[#4B5563] outline-none w-full"
                autoComplete="off"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-60"
            style={{ background: "#10B981", color: "#000" }}
          >
            {loading ? "Verifying..." : "Enter Dashboard"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-xs text-[#4B5563] text-center mt-6">
          Default key: <span style={{ fontFamily: "'DM Mono', monospace" }}>chrono-dev-admin</span>
          {" "}(change in Supabase)
        </p>
      </div>
    </div>
  );
}
