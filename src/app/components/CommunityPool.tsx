import { useCallback, useEffect, useState } from "react";
import {
  HeartHandshake,
  Droplets,
  Gift,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { dashColors, aero } from "./onboarding/aeroTheme";
import {
  POOL_RULES,
  fetchPoolEligibility,
  fetchRecentPoolActivity,
  donateToPool,
  claimFromPool,
  formatClaimWindowLabel,
  type PoolEligibility,
  type PoolTransaction,
} from "../../lib/community-pool";

interface CommunityPoolProps {
  onNavigate: (screen: string, options?: { boardMode?: "all" | "needs" | "offers" }) => void;
}

const DONATE_PRESETS = [0.5, 1, 2];

export function CommunityPool({ onNavigate }: CommunityPoolProps) {
  const { user, refreshUser } = useAuth();
  const [eligibility, setEligibility] = useState<PoolEligibility | null>(null);
  const [activity, setActivity] = useState<PoolTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [donateAmount, setDonateAmount] = useState(1);
  const [donating, setDonating] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [elig, recent] = await Promise.all([
        fetchPoolEligibility(user.userId),
        fetchRecentPoolActivity(),
      ]);
      setEligibility(elig);
      setActivity(recent);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDonate = async () => {
    if (!user || donateAmount <= 0) return;
    if (user.hoursAvailable < donateAmount) {
      setMessage({ type: "error", text: "You don't have enough hours to donate." });
      return;
    }
    setDonating(true);
    setMessage(null);
    try {
      await donateToPool(donateAmount);
      await refreshUser();
      await load();
      setMessage({ type: "success", text: `Thank you! ${donateAmount}h added to the community pool.` });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Donation failed. Try again later.",
      });
    } finally {
      setDonating(false);
    }
  };

  const handleClaim = async () => {
    if (!user || !eligibility?.canClaim) return;
    setClaiming(true);
    setMessage(null);
    try {
      await claimFromPool(POOL_RULES.maxClaimPerWeek);
      await refreshUser();
      await load();
      setMessage({ type: "success", text: "1 hour claimed from the pool — use it wisely!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Claim failed. Try again later.",
      });
    } finally {
      setClaiming(false);
    }
  };

  const helpProgress = eligibility
    ? Math.min(1, eligibility.recentHelps / eligibility.effectiveHelpsRequired)
    : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Hero — pool balance */}
      <div
        className="dash-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(94,255,240,0.12) 50%, rgba(91,199,122,0.15) 100%)`,
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake size={20} className="dash-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider dash-subtext">
              Community solidarity pool
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold dash-heading mb-1">
            Hours shared by neighbors, for neighbors
          </h2>
          <p className="text-sm dash-subtext max-w-lg mb-6">
            Donate hours you can spare. When you need a boost, earn access by helping others first —
            then claim during weekend windows.
          </p>

          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs dash-subtext mb-1">Pool balance</p>
              <p
                className="text-4xl font-bold dash-heading tabular-nums"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                {loading ? "—" : eligibility?.poolBalance.toFixed(1) ?? "0.0"}
                <span className="text-lg font-medium dash-subtext ml-1">hrs</span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs dash-subtext">
              <Droplets size={14} className="dash-accent" />
              <span>Funded by donations · separate from offer minting</span>
            </div>
          </div>
        </div>
        <Sparkles
          size={120}
          className="absolute -right-4 -bottom-4 opacity-[0.07] dash-accent pointer-events-none"
        />
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-[rgba(91,199,122,0.4)] bg-[rgba(91,199,122,0.15)] text-[var(--dash-earn)]"
              : "border border-red-300/40 bg-red-500/10 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Eligibility */}
        <div className="dash-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="dash-accent" />
            <h3 className="text-sm font-semibold dash-heading">Your access progress</h3>
          </div>

          {loading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
            </div>
          ) : eligibility ? (
            <>
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="dash-subtext">
                    Helps in last {POOL_RULES.lookbackDays} days
                  </span>
                  <span className="font-semibold dash-heading">
                    {eligibility.recentHelps} / {eligibility.effectiveHelpsRequired}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${helpProgress * 100}%`,
                      background: aero.gradientProgress,
                    }}
                  />
                </div>
              </div>

              {eligibility.donationCredits > 0 && (
                <p className="text-xs dash-subtext flex items-center gap-1.5">
                  <Gift size={12} className="text-[var(--dash-earn)]" />
                  Donor credit: need {eligibility.effectiveHelpsRequired} help
                  {eligibility.effectiveHelpsRequired === 1 ? "" : "s"} instead of{" "}
                  {eligibility.helpsRequired}
                </p>
              )}

              <ul className="space-y-2 text-xs">
                <StatusRow
                  ok={eligibility.isEligible}
                  label={`Help ${eligibility.effectiveHelpsRequired} people in ${POOL_RULES.lookbackDays} days`}
                />
                <StatusRow
                  ok={!eligibility.claimedThisWeek}
                  label="One claim per week"
                />
                <StatusRow
                  ok={eligibility.claimWindowOpen}
                  label={`Claim window: ${formatClaimWindowLabel()}`}
                />
                <StatusRow
                  ok={eligibility.poolBalance >= POOL_RULES.minPoolBalance}
                  label={`Pool holds at least ${POOL_RULES.minPoolBalance}h`}
                />
              </ul>

              {!eligibility.canClaim && eligibility.blockReason && (
                <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-white/30 text-xs dash-subtext">
                  <Lock size={13} className="flex-shrink-0 mt-0.5" />
                  {eligibility.blockReason}
                </div>
              )}

              {!eligibility.isEligible && (
                <button
                  type="button"
                  onClick={() => onNavigate("board", { boardMode: "needs" })}
                  className="dash-btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                >
                  Find someone to help
                  <ArrowRight size={14} />
                </button>
              )}
            </>
          ) : null}
        </div>

        {/* Claim */}
        <div className="dash-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="dash-accent" />
            <h3 className="text-sm font-semibold dash-heading">Claim from pool</h3>
          </div>

          <p className="text-xs dash-subtext leading-relaxed">
            When eligible, take up to <strong className="dash-heading">{POOL_RULES.maxClaimPerWeek} hour</strong>{" "}
            per week during {formatClaimWindowLabel()}. This keeps the pool sustainable for everyone.
          </p>

          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: dashColors.earnBg,
              border: `1px solid ${dashColors.earnBorder}`,
            }}
          >
            <p className="text-3xl font-bold tabular-nums" style={{ color: dashColors.earn }}>
              {POOL_RULES.maxClaimPerWeek}h
            </p>
            <p className="text-xs mt-1" style={{ color: dashColors.earn }}>
              max per week
            </p>
          </div>

          <button
            type="button"
            disabled={!eligibility?.canClaim || claiming}
            onClick={handleClaim}
            className="dash-btn-primary w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {claiming ? "Claiming…" : eligibility?.canClaim ? "Claim 1 hour" : "Not available yet"}
          </button>
        </div>
      </div>

      {/* Donate */}
      <div className="dash-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Gift size={16} className="dash-accent" />
            <h3 className="text-sm font-semibold dash-heading">Donate hours</h3>
          </div>
          {user && (
            <p className="text-xs dash-subtext">
              Your balance:{" "}
              <span className="font-semibold dash-heading">{user.hoursAvailable.toFixed(1)}h</span>
            </p>
          )}
        </div>

        <p className="text-xs dash-subtext">
          Give back to the community. Donors get credit toward pool access — each hour donated in the
          last 90 days counts as one help toward the requirement.
        </p>

        <div className="flex flex-wrap gap-2">
          {DONATE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDonateAmount(preset)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                donateAmount === preset ? "dash-pill-active" : "dash-pill-inactive"
              }`}
            >
              {preset}h
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={donating || !user || user.hoursAvailable < donateAmount}
          onClick={handleDonate}
          className="dash-btn-secondary w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium disabled:opacity-45"
        >
          {donating ? "Donating…" : `Donate ${donateAmount}h to pool`}
        </button>
      </div>

      {/* How it works */}
      <div className="dash-card rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold dash-heading">How access works</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <RuleCard
            step="1"
            icon={<Users size={16} />}
            title="Give first"
            desc={`Complete ${POOL_RULES.helpsRequired} verified helps in ${POOL_RULES.lookbackDays} days — accept a need or post an offer someone uses.`}
          />
          <RuleCard
            step="2"
            icon={<Calendar size={16} />}
            title="Weekend window"
            desc={`Claims open ${formatClaimWindowLabel()} only. One hour max per week so the pool stays healthy.`}
          />
          <RuleCard
            step="3"
            icon={<Gift size={16} />}
            title="Donor perk"
            desc="Donate hours anytime. Each hour donated reduces your help requirement by 1 (minimum 1 help still required)."
          />
        </div>
      </div>

      {/* Activity feed */}
      {activity.length > 0 && (
        <div className="dash-card rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold dash-heading">Recent pool activity</h3>
          <ul className="space-y-2">
            {activity.map((tx) => (
              <li
                key={tx.id}
                className="flex items-center justify-between gap-3 text-xs py-2 border-b border-white/20 last:border-0"
              >
                <span className="dash-subtext truncate">
                  {tx.profiles?.full_name ?? "Someone"}{" "}
                  {tx.transaction_type === "donation" ? "donated" : "claimed"}
                </span>
                <span
                  className="font-semibold tabular-nums flex-shrink-0"
                  style={{
                    color: tx.transaction_type === "donation" ? dashColors.earn : dashColors.spend,
                  }}
                >
                  {tx.transaction_type === "donation" ? "+" : "−"}
                  {Number(tx.amount).toFixed(1)}h
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 dash-subtext">
      {ok ? (
        <CheckCircle2 size={14} className="text-[var(--dash-earn)] flex-shrink-0" />
      ) : (
        <Lock size={14} className="opacity-50 flex-shrink-0" />
      )}
      <span className={ok ? "dash-heading" : ""}>{label}</span>
    </li>
  );
}

function RuleCard({
  step,
  icon,
  title,
  desc,
}: {
  step: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl p-4 bg-white/25 space-y-2">
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: aero.gradientPrimary }}
        >
          {step}
        </span>
        <span className="dash-accent">{icon}</span>
        <span className="text-xs font-semibold dash-heading">{title}</span>
      </div>
      <p className="text-xs dash-subtext leading-relaxed">{desc}</p>
    </div>
  );
}
