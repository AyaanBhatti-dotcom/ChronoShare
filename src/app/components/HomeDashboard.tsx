import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, ArrowUpRight, ArrowDownRight, CheckCircle2, Loader2, ChevronRight } from "lucide-react";

const earnedData = [
  { day: "Jun 1", hours: 0.5 }, { day: "Jun 5", hours: 1.0 }, { day: "Jun 8", hours: 0.5 },
  { day: "Jun 12", hours: 2.0 }, { day: "Jun 15", hours: 1.5 }, { day: "Jun 19", hours: 2.5 },
  { day: "Jun 22", hours: 1.0 }, { day: "Jun 26", hours: 3.0 }, { day: "Jun 30", hours: 2.0 },
];

const spentData = [
  { day: "Jun 1", hours: 1.0 }, { day: "Jun 5", hours: 0.5 }, { day: "Jun 8", hours: 1.5 },
  { day: "Jun 12", hours: 0.5 }, { day: "Jun 15", hours: 2.0 }, { day: "Jun 19", hours: 1.0 },
  { day: "Jun 22", hours: 2.5 }, { day: "Jun 26", hours: 0.5 }, { day: "Jun 30", hours: 1.5 },
];

const exchanges = [
  { id: 1, avatar: "SL", name: "Sofia Larsson", task: "React component refactoring", cost: "2.0h", status: "Completed" },
  { id: 2, avatar: "MK", name: "Marcus Kim", task: "Plumbing fixture replacement", cost: "1.5h", status: "In Progress" },
  { id: 3, avatar: "AR", name: "Amara Reyes", task: "Spanish tutoring session", cost: "1.0h", status: "Completed" },
  { id: 4, avatar: "JP", name: "Jonas Petrov", task: "Logo & brand identity design", cost: "3.0h", status: "In Progress" },
];

const StatusPill = ({ status }: { status: string }) => {
  const isComplete = status === "Completed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        isComplete
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
      }`}
    >
      {isComplete ? <CheckCircle2 size={11} /> : <Loader2 size={11} className="animate-spin" />}
      {status}
    </span>
  );
};

const MiniChart = ({
  data,
  color,
  label,
  total,
  trend,
}: {
  data: { day: string; hours: number }[];
  color: string;
  label: string;
  total: string;
  trend: "up" | "down";
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
      <span
        className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
          trend === "up"
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-red-500/10 text-red-400"
        }`}
      >
        {trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend === "up" ? "+18%" : "-6%"}
      </span>
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
          itemStyle={{ color: color }}
          labelStyle={{ color: "#9CA3AF" }}
          formatter={(v: number) => [`${v}h`, ""]}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const HomeDashboard = ({ onNavigate }: { onNavigate: (s: string) => void }) => (
  <div className="space-y-6">
    {/* Quick Stats */}
    <div className="grid grid-cols-2 gap-4">
      <MiniChart data={earnedData} color="#10B981" label="Hours Earned (30d)" total="13.5h" trend="up" />
      <MiniChart data={spentData} color="#06B6D4" label="Hours Spent (30d)" total="11.0h" trend="down" />
    </div>

    {/* Hour Hub */}
    <div
      className="relative rounded-2xl p-8 border overflow-hidden text-center"
      style={{
        background: "linear-gradient(135deg, #0f1e2e 0%, #111827 60%, #0f1e2e 100%)",
        borderColor: "#10B981",
        boxShadow: "0 0 40px rgba(16,185,129,0.15), inset 0 1px 0 rgba(16,185,129,0.1)",
      }}
    >
      {/* Glow blob */}
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
          1.0
        </p>
        <p className="text-emerald-400 text-lg mb-8">Hours</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate("post")}
            className="px-8 py-3 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "#10B981", color: "#000" }}
          >
            Offer Time
          </button>
          <button
            onClick={() => onNavigate("post")}
            className="px-8 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:bg-emerald-500/10 active:scale-[0.98]"
            style={{ borderColor: "#10B981", color: "#10B981" }}
          >
            Request Time
          </button>
        </div>
      </div>
    </div>

    {/* Recent Exchanges */}
    <div className="rounded-2xl border overflow-hidden" style={{ background: "#111827", borderColor: "#1F2937" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1F2937" }}>
        <h3 className="text-sm font-semibold text-white">Recent Exchanges</h3>
        <button
          onClick={() => onNavigate("board")}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all <ChevronRight size={14} />
        </button>
      </div>
      <div className="divide-y" style={{ borderColor: "#1F2937" }}>
        {exchanges.map((ex) => (
          <div key={ex.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
            >
              {ex.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{ex.name}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{ex.task}</p>
            </div>
            <span
              className="text-sm font-medium flex-shrink-0"
              style={{ fontFamily: "'DM Mono', monospace", color: "#9CA3AF" }}
            >
              {ex.cost}
            </span>
            <StatusPill status={ex.status} />
          </div>
        ))}
      </div>
    </div>
  </div>
);
