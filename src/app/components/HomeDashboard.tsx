import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, ArrowUpRight, ArrowDownRight, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import { fetchRecentExchanges, getExchangePartner } from "../../lib/exchanges";
import type { ExchangeWithProfiles } from "../../types/database";

const earnedData = [
  { day: "W1", hours: 0 }, { day: "W2", hours: 0.5 }, { day: "W3", hours: 1.0 },
  { day: "W4", hours: 0.5 }, { day: "W5", hours: 2.0 },
];

const spentData = [
  { day: "W1", hours: 0.5 }, { day: "W2", hours: 0 }, { day: "W3", hours: 1.0 },
  { day: "W4", hours: 1.5 }, { day: "W5", hours: 0.5 },
];

const StatusPill = ({ status }: { status: string }) => {
  const isComplete = status === "completed";
  const isCancelled = status === "cancelled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isComplete
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : isCancelled
            ? "bg-gray-500/10 text-gray-400 border border-gray-500/20"
            : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
      }`}
    >
      {isComplete ? (
        <CheckCircle2 size={11} />
      ) : isCancelled ? null : (
        <Loader2 size={11} className="animate-spin" />
      )}
      {status === "in_progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MiniChart = ({
  data,
  color,
  label,
  total,
}: {
  data: { day: string; hours: number }[];
  color: string;
  label: string;
  total: string;
}) => (
  <div
    className="rounded-2xl p-5 border"
    style={{ background: "#111827", borderColor: "#1F2937" }}
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="text-xs text-[#9CA3AF] mb-1">{label}</p>
        <p className="text-2xl font-semibold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
          {total}
        </p>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={60}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="hours"
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${label})`}
          dot={false}
        />
        <Tooltip
          contentStyle={{ background: "#1F2937", border: "none", borderRadius: 8, fontSize: 11 }}
          itemStyle={{ color }}
          labelStyle={{ color: "#9CA3AF" }}
          formatter={(v: number) => [`${v}h`, ""]}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

interface HomeDashboardProps {
  onNavigate: (s: string, options?: { postType?: "needs" | "offers" }) => void;
}

export const HomeDashboard = ({ onNavigate }: HomeDashboardProps) => {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchRecentExchanges(user.userId, 4)
      .then(setExchanges)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [user]);

  const hoursEarned = exchanges.reduce((sum, ex) => {
    const isEarn =
      (ex.post_type === "needs" && ex.acceptor_id === user?.userId) ||
      (ex.post_type === "offers" && ex.poster_id === user?.userId);
    return isEarn && ex.status !== "cancelled" ? sum + ex.hours : sum;
  }, 0);

  const hoursSpent = exchanges.reduce((sum, ex) => {
    const isSpend =
      (ex.post_type === "needs" && ex.poster_id === user?.userId) ||
      (ex.post_type === "offers" && ex.acceptor_id === user?.userId);
    return isSpend && ex.status !== "cancelled" ? sum + ex.hours : sum;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <MiniChart
          data={earnedData}
          color="#10B981"
          label="Hours Earned"
          total={`${hoursEarned.toFixed(1)}h`}
        />
        <MiniChart
          data={spentData}
          color="#06B6D4"
          label="Hours Spent"
          total={`${hoursSpent.toFixed(1)}h`}
        />
      </div>

      <div
        className="relative rounded-2xl p-8 border overflow-hidden text-center"
        style={{
          background: "linear-gradient(135deg, #0f1e2e 0%, #111827 60%, #0f1e2e 100%)",
          borderColor: "#10B981",
          boxShadow: "0 0 40px rgba(16,185,129,0.15), inset 0 1px 0 rgba(16,185,129,0.1)",
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)" }}
        />
        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock size={16} className="text-emerald-400" />
            <p className="text-sm text-[#9CA3AF] tracking-wide uppercase">Available Balance</p>
          </div>
          <p
            className="text-8xl font-semibold text-white mb-1"
            style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}
          >
            {user?.hoursAvailable.toFixed(1) ?? "0.0"}
          </p>
          <p className="text-emerald-400 text-lg mb-8">Hours</p>
          <div className="flex items-center justify-center gap-3" data-tour="quick-actions">
            <button
              onClick={() => onNavigate("post", { postType: "offers" })}
              className="px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "#10B981", color: "#000" }}
            >
              Offer Time
            </button>
            <button
              onClick={() => onNavigate("post", { postType: "needs" })}
              className="px-8 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:bg-emerald-500/10 active:scale-[0.98]"
              style={{ borderColor: "#10B981", color: "#10B981" }}
            >
              Request Time
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "#111827", borderColor: "#1F2937" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1F2937" }}>
          <h3 className="text-sm font-semibold text-white">Recent Exchanges</h3>
          <button
            onClick={() => onNavigate("profile")}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : exchanges.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-[#9CA3AF] mb-3">No exchanges yet.</p>
            <button
              onClick={() => onNavigate("board")}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Browse the Job Board to get started
            </button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#1F2937" }}>
            {exchanges.map((ex) => {
              const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
              const isEarn =
                (ex.post_type === "needs" && ex.acceptor_id === user?.userId) ||
                (ex.post_type === "offers" && ex.poster_id === user?.userId);
              return (
                <div key={ex.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                  >
                    {getInitials(partner.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{partner.name}</p>
                    <p className="text-xs text-[#9CA3AF] truncate">{ex.title}</p>
                  </div>
                  <span
                    className="text-sm font-medium flex-shrink-0 flex items-center gap-0.5"
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      color: isEarn ? "#10B981" : "#06B6D4",
                    }}
                  >
                    {isEarn ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {ex.hours}h
                  </span>
                  <StatusPill status={ex.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
