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
  confirmExchange,
  cancelExchange,
  hasUserConfirmed,
  isPartnerConfirmed,
} from "../../lib/exchanges";
import type { ExchangeWithProfiles } from "../../types/database";
import { dashColors } from "./onboarding/aeroTheme";
import { formatExchangeFormat } from "../../lib/exchange-format";

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
    .filter((ex) => ex.status === "completed")
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

  const handleConfirm = async (exchangeId: string) => {
    if (isPreview) return;
    setActionId(exchangeId);
    setError(null);
    try {
      await confirmExchange(exchangeId);
      await refreshUser();
      await loadExchanges();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm exchange");
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

  const pending = exchanges.filter((ex) => ex.status === "pending");

  return (
    <div className="space-y-6">
      <div className="dash-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="dash-avatar w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
          {user ? getInitials(user.name) : "?"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold dash-heading">{user?.name ?? "User"}</h2>
            <span className="dash-badge-earn flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium">
              <ShieldCheck size={11} />
              Verified Identity
            </span>
          </div>
          <p className="text-sm dash-subtext">
            {user?.email} · {user?.hoursAvailable.toFixed(1)} hrs available
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Exchanges", value: String(history.length), color: dashColors.earn },
          { label: "Hours Earned", value: `${hoursEarned.toFixed(1)}h`, color: dashColors.spend },
          { label: "Hours Spent", value: `${hoursReceived.toFixed(1)}h`, color: dashColors.sun },
        ].map((stat) => (
          <div key={stat.label} className="dash-card rounded-2xl p-4 text-center">
            <p
              className="text-2xl font-semibold mb-1"
              style={{ fontFamily: "'DM Mono', monospace", color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-xs dash-subtext leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="dash-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b dash-divider">
            <h3 className="text-sm font-semibold dash-heading flex items-center gap-2">
              <Loader2 size={14} className="dash-accent animate-spin" />
              Awaiting Confirmation
            </h3>
            <p className="text-xs dash-subtext mt-1">
              Both people must confirm before hours are transferred.
            </p>
          </div>
          <div className="divide-y dash-divider">
            {pending.map((ex) => {
              const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
              const userConfirmed = user ? hasUserConfirmed(ex, user.userId) : false;
              const partnerConfirmed = user ? isPartnerConfirmed(ex, user.userId) : false;
              return (
                <div key={ex.id} className="flex flex-col gap-3 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dash-heading">{ex.title}</p>
                    <p className="text-xs dash-subtext">
                      with {partner.name} · {ex.hours}h
                      {ex.exchange_format
                        ? ` · ${formatExchangeFormat(ex.exchange_format)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className={`dash-badge px-2 py-0.5 rounded-full ${userConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                      You {userConfirmed ? "confirmed" : "pending"}
                    </span>
                    <span className={`dash-badge px-2 py-0.5 rounded-full ${partnerConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                      {partner.name.split(" ")[0]} {partnerConfirmed ? "confirmed" : "pending"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!userConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleConfirm(ex.id)}
                        disabled={actionId === ex.id || isPreview}
                        className="dash-btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60"
                      >
                        <CheckCircle2 size={13} />
                        Confirm exchange
                      </button>
                    )}
                    {userConfirmed && !partnerConfirmed && (
                      <p className="text-xs dash-subtext">Waiting for {partner.name.split(" ")[0]} to confirm…</p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCancel(ex.id)}
                      disabled={actionId === ex.id || isPreview}
                      className="dash-btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-60"
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

      <div className="dash-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b dash-divider">
          <h3 className="text-sm font-semibold dash-heading">Exchange Ledger</h3>
          <div className="dash-pill-group flex rounded-full p-0.5">
            {(["all", "given", "received"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all duration-200 ${
                  tab === t ? "dash-pill-active" : "dash-pill-inactive"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm dash-subtext">
            No exchanges yet. Browse the Job Board to join one!
          </div>
        ) : (
          <div className="divide-y dash-divider">
            {filtered.map((item) => (
              <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/25 transition-colors">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.type === "given"
                      ? "dash-badge-earn"
                      : item.type === "received"
                        ? "dash-badge-spend"
                        : "dash-badge-neutral"
                  }`}
                >
                  {item.type === "given" ? (
                    <ArrowUpRight size={14} className="dash-accent-grass" />
                  ) : item.type === "received" ? (
                    <ArrowDownLeft size={14} className="dash-accent" />
                  ) : (
                    <CheckCircle2 size={14} className="dash-subtext" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium dash-heading truncate">{item.task}</p>
                  <p className="text-xs dash-subtext">
                    {item.type === "given"
                      ? "Earned with"
                      : item.type === "received"
                        ? "Paid to"
                        : "Joined"}{" "}
                    {item.name} · {item.date}
                    {item.raw.exchange_format
                      ? ` · ${formatExchangeFormat(item.raw.exchange_format)}`
                      : ""}
                  </p>
                </div>
                <span
                  className="text-sm font-medium flex-shrink-0"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    color:
                      item.type === "given"
                        ? dashColors.earn
                        : item.type === "received"
                          ? dashColors.spend
                          : dashColors.neutral,
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
