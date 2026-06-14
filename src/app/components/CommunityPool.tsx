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
import { dashColors } from "./onboarding/aeroTheme";
import RotatingEarth from "./ui/wireframe-dotted-globe";
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
    <div className="pool-scene">
      {/* Hero — headline + globe, one soft glass surface */}
      <section className="pool-hero" aria-labelledby="pool-heading">
        <div className="pool-hero-copy">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake size={20} className="dash-accent" />
            <span className="pool-label uppercase tracking-wider">
              Community solidarity pool
            </span>
          </div>
          <h2 id="pool-heading" className="text-2xl sm:text-3xl font-bold dash-heading mb-1 leading-tight">
            Hours shared by neighbors, for neighbors
          </h2>
          <p className="text-sm pool-body max-w-md mb-2">
            Donate hours you can spare. When you need a boost, earn access by helping others first —
            then claim during weekend windows.
          </p>

          <p className="pool-label mb-0.5">Pool balance</p>
          <p className="pool-balance">
            {loading ? "—" : eligibility?.poolBalance.toFixed(1) ?? "0.0"}
            <span className="pool-balance-unit">hrs</span>
          </p>

          <div className="flex items-center gap-2 pool-body mt-3">
            <Droplets size={14} className="dash-accent flex-shrink-0" />
            <span>Funded by donations · separate from offer minting</span>
          </div>
        </div>

        <div className="pool-hero-globe">
          <RotatingEarth height={280} className="h-full" />
        </div>

        <Sparkles
          size={100}
          className="absolute right-6 top-6 opacity-[0.06] dash-accent pointer-events-none hidden sm:block"
        />
      </section>

      {message && (
        <div
          className={`pool-toast ${message.type === "success" ? "pool-toast-success" : "pool-toast-error"}`}
          role="status"
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="flex-shrink-0" />
          ) : (
            <Lock size={16} className="flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Access + claim */}
      <div className="pool-glass pool-split">
        <section className="pool-flow-section" aria-labelledby="pool-access-heading">
          <div className="pool-section-head">
            <Users size={16} className="dash-accent" />
            <h3 id="pool-access-heading" className="pool-section-title">
              Your access progress
            </h3>
          </div>

          {loading ? (
            <div className="h-16 flex items-center">
              <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
            </div>
          ) : eligibility ? (
            <>
              <div className="flex justify-between mb-2">
                <span className="pool-label">Helps in last {POOL_RULES.lookbackDays} days</span>
                <span className="font-bold dash-heading">
                  {eligibility.recentHelps} / {eligibility.effectiveHelpsRequired}
                </span>
              </div>
              <div className="pool-progress-track">
                <div
                  className="pool-progress-fill"
                  style={{ width: `${helpProgress * 100}%` }}
                />
              </div>

              {eligibility.donationCredits > 0 && (
                <p className="pool-body flex items-center gap-1.5 mt-3">
                  <Gift size={12} className="text-[var(--dash-earn)]" />
                  Donor credit: need {eligibility.effectiveHelpsRequired} help
                  {eligibility.effectiveHelpsRequired === 1 ? "" : "s"} instead of{" "}
                  {eligibility.helpsRequired}
                </p>
              )}

              <ul className="pool-status-list">
                <StatusRow
                  ok={eligibility.isEligible}
                  label={`Help ${eligibility.effectiveHelpsRequired} people in ${POOL_RULES.lookbackDays} days`}
                />
                <StatusRow ok={!eligibility.claimedThisWeek} label="One claim per week" />
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
                <div className="pool-hint">
                  <Lock size={13} className="flex-shrink-0 mt-0.5" />
                  {eligibility.blockReason}
                </div>
              )}

              {!eligibility.isEligible && (
                <button
                  type="button"
                  onClick={() => onNavigate("board", { boardMode: "needs" })}
                  className="dash-btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium mt-4"
                >
                  Find someone to help
                  <ArrowRight size={14} />
                </button>
              )}
            </>
          ) : null}
        </section>

        <section
          className="pool-flow-section pool-flow-section-accent"
          aria-labelledby="pool-claim-heading"
        >
          <div className="pool-section-head">
            <Clock size={16} className="dash-accent" />
            <h3 id="pool-claim-heading" className="pool-section-title">
              Claim from pool
            </h3>
          </div>

          <p className="pool-body">
            When eligible, take up to{" "}
            <strong>{POOL_RULES.maxClaimPerWeek} hour</strong> per week during{" "}
            {formatClaimWindowLabel()}. This keeps the pool sustainable for everyone.
          </p>

          <div className="pool-claim-meter">
            <p className="pool-claim-value">{POOL_RULES.maxClaimPerWeek}h</p>
            <p className="pool-label">max per week</p>
          </div>

          <button
            type="button"
            disabled={!eligibility?.canClaim || claiming}
            onClick={handleClaim}
            className="dash-btn-primary w-full py-2.5 rounded-full text-sm font-medium disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {claiming ? "Claiming…" : eligibility?.canClaim ? "Claim 1 hour" : "Not available yet"}
          </button>
        </section>
      </div>

      {/* Donate */}
      <section className="pool-glass pool-ribbon" aria-labelledby="pool-donate-heading">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
          <div className="pool-section-head mb-0">
            <Gift size={16} className="dash-accent" />
            <h3 id="pool-donate-heading" className="pool-section-title">
              Donate hours
            </h3>
          </div>
          {user && (
            <p className="pool-label">
              Your balance:{" "}
              <span className="font-bold dash-heading">{user.hoursAvailable.toFixed(1)}h</span>
            </p>
          )}
        </div>

        <p className="pool-body max-w-2xl">
          Give back to the community. Donors get credit toward pool access — each hour donated in the
          last 90 days counts as one help toward the requirement.
        </p>

        <div className="pool-donate-row">
          {DONATE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDonateAmount(preset)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                donateAmount === preset ? "dash-pill-active" : "dash-pill-inactive"
              }`}
            >
              {preset}h
            </button>
          ))}
          <button
            type="button"
            disabled={donating || !user || user.hoursAvailable < donateAmount}
            onClick={handleDonate}
            className="dash-btn-secondary px-6 py-2.5 rounded-full text-sm font-medium disabled:opacity-45"
          >
            {donating ? "Donating…" : `Donate ${donateAmount}h to pool`}
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="pool-glass" aria-labelledby="pool-how-heading">
        <h3 id="pool-how-heading" className="pool-section-title mb-4">
          How access works
        </h3>
        <div className="pool-steps">
          <RuleStep
            step="1"
            icon={<Users size={15} />}
            title="Give first"
            desc={`Complete ${POOL_RULES.helpsRequired} verified helps in ${POOL_RULES.lookbackDays} days — accept a need or post an offer someone uses.`}
          />
          <RuleStep
            step="2"
            icon={<Calendar size={15} />}
            title="Weekend window"
            desc={`Claims open ${formatClaimWindowLabel()} only. One hour max per week so the pool stays healthy.`}
          />
          <RuleStep
            step="3"
            icon={<Gift size={15} />}
            title="Donor perk"
            desc="Donate hours anytime. Each hour donated reduces your help requirement by 1 (minimum 1 help still required)."
          />
        </div>
      </section>

      {/* Activity — timeline strip */}
      {activity.length > 0 && (
        <section className="pool-glass pool-timeline" aria-labelledby="pool-activity-heading">
          <h3 id="pool-activity-heading" className="pool-section-title">
            Recent pool activity
          </h3>
          <ul className="pool-timeline-list">
            {activity.map((tx) => (
              <li key={tx.id} className="pool-timeline-item">
                <span className="truncate">
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
        </section>
      )}
    </div>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`pool-status-chip ${ok ? "pool-status-chip-done" : ""}`}>
      {ok ? (
        <CheckCircle2 size={14} className="text-[var(--dash-earn)] flex-shrink-0" />
      ) : (
        <Lock size={14} className="opacity-45 flex-shrink-0" />
      )}
      <span>{label}</span>
    </li>
  );
}

function RuleStep({
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
    <div className="pool-step">
      <span className="pool-step-badge">{step}</span>
      <span className="dash-accent">{icon}</span>
      <span className="pool-step-title">{title}</span>
      <p className="pool-step-desc">{desc}</p>
    </div>
  );
}
