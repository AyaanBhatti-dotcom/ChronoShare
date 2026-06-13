import { useState } from "react";
import { ShieldCheck, Star, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";

const history = [
  { id: 1, type: "given", name: "Sofia Larsson", task: "React component refactoring", hours: 2.0, date: "Jun 10, 2026" },
  { id: 2, type: "received", name: "Marcus Kim", task: "Plumbing fixture replacement", hours: 1.5, date: "Jun 7, 2026" },
  { id: 3, type: "given", name: "Amara Reyes", task: "Spanish tutoring session", hours: 1.0, date: "May 29, 2026" },
  { id: 4, type: "received", name: "Jonas Petrov", task: "Logo & brand identity design", hours: 3.0, date: "May 22, 2026" },
  { id: 5, type: "given", name: "Priya Okafor", task: "Interior painting guidance", hours: 1.5, date: "May 15, 2026" },
  { id: 6, type: "received", name: "Leo Marchand", task: "Drum lessons for beginners", hours: 1.0, date: "May 8, 2026" },
];

export const Profile = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"all" | "given" | "received">("all");

  const filtered = history.filter((h) => tab === "all" || h.type === tab);

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <p className="text-sm text-[#9CA3AF]">alex.johnson@chronoshare.io · Member since March 2025</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Exchanges", value: "24", color: "#10B981" },
          { label: "Hours Earned (All-Time)", value: "31.5h", color: "#06B6D4" },
          { label: "Community Rating", value: "4.9", suffix: <Star size={14} className="inline mb-0.5" />, color: "#F59E0B" },
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
              {stat.value}{stat.suffix}
            </p>
            <p className="text-xs text-[#9CA3AF] leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* History */}
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
        <div className="divide-y" style={{ borderColor: "#1F2937" }}>
          {filtered.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: item.type === "given" ? "rgba(16,185,129,0.12)" : "rgba(6,182,212,0.12)",
                  border: `1px solid ${item.type === "given" ? "rgba(16,185,129,0.25)" : "rgba(6,182,212,0.25)"}`,
                }}
              >
                {item.type === "given" ? (
                  <ArrowUpRight size={14} className="text-emerald-400" />
                ) : (
                  <ArrowDownLeft size={14} className="text-cyan-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.task}</p>
                <p className="text-xs text-[#9CA3AF]">
                  {item.type === "given" ? "Given to" : "Received from"} {item.name} · {item.date}
                </p>
              </div>
              <span
                className="text-sm font-medium flex-shrink-0"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  color: item.type === "given" ? "#10B981" : "#06B6D4",
                }}
              >
                {item.type === "given" ? "+" : "-"}{item.hours}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
