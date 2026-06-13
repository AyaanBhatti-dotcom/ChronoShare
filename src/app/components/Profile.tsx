import { useCallback, useEffect, useState } from "react";
import {
  ShieldCheck, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import {
  fetchMyExchanges,
  getExchangePartner,
  getExchangeHourType,
  completeExchange,
  cancelExchange,
} from "../../lib/exchanges";
import type { ExchangeWithProfiles } from "../../types/database";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const Profile = () => {
  const { user, refreshUser, isPreview } = useAuth();
  const [tab, setTab] = useState<"all" | "given" | "received">("all");
  const [exchanges, setExchanges] = useState<ExchangeWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExchanges = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchMyExchanges(user.userId);
      setExchanges(data);
    } catch (err) {
      console.warn("Could not load exchanges:", err);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadExchanges();
  }, [loadExchanges]);

  const history = exchanges
    .filter((ex) => ex.status !== "cancelled")
    .map((ex) => {
      const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
      const hourType = user ? getExchangeHourType(ex, user.userId) : "free";
      return {
        id: ex.id,
        hourType,
        type: hourType === "earned" ? ("given" as const) : hourType === "spent" ? ("received" as const) : ("free" as const),
        name: partner.name,
        task: ex.title,
        hours: ex.hours,
        date: formatDate(ex.completed_at ?? ex.created_at),
        status: ex.status,
        raw: ex,
      };
    });

  const filtered = history.filter((h) => tab === "all" || h.type === tab);

  const hoursEarned = history
    .filter((h) => h.hourType === "earned")
    .reduce((sum, h) => sum + h.hours, 0);

  const hoursReceived = history
    .filter((h) => h.hourType === "spent")
    .reduce((sum, h) => sum + h.hours, 0);

  const handleComplete = async (exchangeId: string) => {
    if (isPreview) return;
    setActionId(exchangeId);
    setError(null);
    try {
      await completeExchange(exchangeId);
      await loadExchanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete exchange");
    }
    setActionId(null);
  };

  const handleCancel = async (exchangeId: string) => {
    if (isPreview) return;
    setActionId(exchangeId);
    setError(null);
    try {
      await cancelExchange(exchangeId);
      await refreshUser();
      await loadExchanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel exchange");
    }
    setActionId(null);
  };

  const inProgress = exchanges.filter((ex) => ex.status === "in_progress");

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6 border flex flex-col sm:flex-row items-start sm:items-center gap-5"
        style={{ background: "#111827", borderColor: "#1F2937" }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
        >
          {user ? getInitials(user.name) : "?"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-white">{user?.name ?? "User"}</h2>
            <span
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <ShieldCheck size={11} />
              Verified Identity
            </span>
          </div>
          <p className="text-sm text-[#9CA3AF]">
            {user?.email} · {user?.hoursAvailable.toFixed(1)} hrs available
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Exchanges", value: String(history.length), color: "#10B981" },
          { label: "Hours Earned", value: `${hoursEarned.toFixed(1)}h`, color: "#06B6D4" },
          { label: "Hours Spent", value: `${hoursReceived.toFixed(1)}h`, color: "#F59E0B", suffix: null },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4 border text-center"
            style={{ background: "#111827", borderColor: "#1F2937" }}
          >
            <p
              className="text-2xl font-semibold mb-1"
              style={{ fontFamily: "'DM Mono', monospace", color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-[#9CA3AF] leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>

      {inProgress.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: "#111827", borderColor: "#1F2937" }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: "#1F2937" }}>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Loader2 size={14} className="text-cyan-400 animate-spin" />
              Active Exchanges
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: "#1F2937" }}>
            {inProgress.map((ex) => {
              const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
              return (
                <div key={ex.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{ex.title}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      with {partner.name} · {ex.hours}h
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleComplete(ex.id)}
                      disabled={actionId === ex.id || isPreview}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60"
                      style={{ background: "#10B981", color: "#000" }}
                    >
                      <CheckCircle2 size={13} />
                      Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancel(ex.id)}
                      disabled={actionId === ex.id || isPreview}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border disabled:opacity-60"
                      style={{ borderColor: "#374151", color: "#9CA3AF" }}
                    >
                      <XCircle size={13} />
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="rounded-2xl border overflow-hidden" style={{ background: "#111827", borderColor: "#1F2937" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1F2937" }}>
          <h3 className="text-sm font-semibold text-white">Exchange Ledger</h3>
          <div
            className="flex rounded-full p-0.5"
            style={{ background: "#0B0F19", border: "1px solid #1F2937" }}
          >
            {(["all", "given", "received"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200"
                style={{
                  background: tab === t ? "#10B981" : "transparent",
                  color: tab === t ? "#000" : "#9CA3AF",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#9CA3AF]">
            No exchanges yet. Browse the Job Board to join one!
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#1F2937" }}>
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                      item.type === "given"
                        ? "rgba(16,185,129,0.12)"
                        : item.type === "received"
                          ? "rgba(6,182,212,0.12)"
                          : "rgba(107,114,128,0.12)",
                    border: `1px solid ${
                      item.type === "given"
                        ? "rgba(16,185,129,0.25)"
                        : item.type === "received"
                          ? "rgba(6,182,212,0.25)"
                          : "rgba(107,114,128,0.25)"
                    }`,
                  }}
                >
                  {item.type === "given" ? (
                    <ArrowUpRight size={14} className="text-emerald-400" />
                  ) : item.type === "received" ? (
                    <ArrowDownLeft size={14} className="text-cyan-400" />
                  ) : (
                    <CheckCircle2 size={14} className="text-[#9CA3AF]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.task}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {item.type === "given"
                      ? "Earned with"
                      : item.type === "received"
                        ? "Paid to"
                        : "Joined"}{" "}
                    {item.name} · {item.date}
                  </p>
                </div>
                <span
                  className="text-sm font-medium flex-shrink-0"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    color:
                      item.type === "given"
                        ? "#10B981"
                        : item.type === "received"
                          ? "#06B6D4"
                          : "#9CA3AF",
                  }}
                >
                  {item.type === "given" ? "+" : item.type === "received" ? "-" : ""}
                  {item.type === "free" ? "Free" : `${item.hours}h`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
