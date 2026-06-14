import { supabase } from "./supabase";
import { fetchCompletedExchanges, getExchangePartner } from "./exchanges";

/** Tunable pool access rules — keep in sync with DB RPCs when migrated. */
export const POOL_RULES = {
  /** Completed helps required in the lookback window to unlock a claim. */
  helpsRequired: 2,
  /** Rolling window for counting helps (days). */
  lookbackDays: 30,
  /** Max hours claimable per calendar week. */
  maxClaimPerWeek: 1,
  /** Claim window: Fri–Sun (local time). 0=Sun, 5=Fri, 6=Sat. */
  claimWindowDays: [0, 5, 6] as const,
  /** Pool must hold at least this many hours before claims open. */
  minPoolBalance: 0.5,
  /** Each hour donated in the last 90 days reduces helps required by this much. */
  donationCreditPerHour: 1,
  /** Minimum helps still required even with donation credits. */
  minHelpsRequired: 1,
  /** Donation lookback for credits (days). */
  donationLookbackDays: 90,
} as const;

export interface PoolTransaction {
  id: string;
  user_id: string | null;
  amount: number;
  transaction_type: "donation" | "claim";
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export interface PoolEligibility {
  recentHelps: number;
  helpsRequired: number;
  donationCredits: number;
  effectiveHelpsRequired: number;
  isEligible: boolean;
  claimedThisWeek: boolean;
  claimWindowOpen: boolean;
  poolBalance: number;
  canClaim: boolean;
  blockReason: string | null;
}

function isClaimWindowOpen(now = new Date()): boolean {
  return (POOL_RULES.claimWindowDays as readonly number[]).includes(now.getDay());
}

function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isHelperExchange(
  exchange: { post_type: "needs" | "offers"; poster_id: string; acceptor_id: string },
  userId: string,
): boolean {
  if (exchange.post_type === "needs") return exchange.acceptor_id === userId;
  return exchange.poster_id === userId;
}

export async function countRecentHelps(userId: string): Promise<number> {
  const exchanges = await fetchCompletedExchanges(userId);
  const cutoff = Date.now() - POOL_RULES.lookbackDays * 24 * 60 * 60 * 1000;

  return exchanges.filter((ex) => {
    if (!ex.completed_at || !isHelperExchange(ex, userId)) return false;
    return new Date(ex.completed_at).getTime() >= cutoff;
  }).length;
}

export async function fetchPoolBalance(): Promise<number> {
  const { data, error } = await supabase.rpc("community_pool_balance");
  if (error) {
    if (error.code === "PGRST202") return 0;
    throw new Error(error.message);
  }
  return Number(data ?? 0);
}

export async function fetchUserDonationsInWindow(
  userId: string,
  days = POOL_RULES.donationLookbackDays,
): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("community_pool_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("transaction_type", "donation")
    .gte("created_at", cutoff);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return 0;
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

export async function hasClaimedThisWeek(userId: string): Promise<boolean> {
  const weekStart = startOfWeek().toISOString();

  const { data, error } = await supabase
    .from("community_pool_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("transaction_type", "claim")
    .gte("created_at", weekStart)
    .limit(1);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return false;
    throw new Error(error.message);
  }

  return (data?.length ?? 0) > 0;
}

export async function fetchPoolEligibility(userId: string): Promise<PoolEligibility> {
  const [recentHelps, donationTotal, claimedThisWeek, poolBalance] = await Promise.all([
    countRecentHelps(userId),
    fetchUserDonationsInWindow(userId),
    hasClaimedThisWeek(userId),
    fetchPoolBalance(),
  ]);

  const donationCredits = Math.floor(donationTotal * POOL_RULES.donationCreditPerHour);
  const effectiveHelpsRequired = Math.max(
    POOL_RULES.minHelpsRequired,
    POOL_RULES.helpsRequired - donationCredits,
  );
  const claimWindowOpen = isClaimWindowOpen();
  const isEligible = recentHelps >= effectiveHelpsRequired;

  let blockReason: string | null = null;
  if (!isEligible) {
    blockReason = `Help ${effectiveHelpsRequired - recentHelps} more ${effectiveHelpsRequired - recentHelps === 1 ? "person" : "people"} in the next ${POOL_RULES.lookbackDays} days`;
  } else if (claimedThisWeek) {
    blockReason = "You've already claimed this week — come back Monday";
  } else if (!claimWindowOpen) {
    blockReason = "Claims open Fri–Sun — the pool is restocked for weekend access";
  } else if (poolBalance < POOL_RULES.minPoolBalance) {
    blockReason = "Pool is low — donate or check back when others contribute";
  }

  const canClaim =
    isEligible && !claimedThisWeek && claimWindowOpen && poolBalance >= POOL_RULES.minPoolBalance;

  return {
    recentHelps,
    helpsRequired: POOL_RULES.helpsRequired,
    donationCredits,
    effectiveHelpsRequired,
    isEligible,
    claimedThisWeek,
    claimWindowOpen,
    poolBalance,
    canClaim,
    blockReason,
  };
}

export async function fetchRecentPoolActivity(limit = 8): Promise<PoolTransaction[]> {
  const { data, error } = await supabase
    .from("community_pool_transactions")
    .select("id, user_id, amount, transaction_type, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw new Error(error.message);
  }

  return (data ?? []) as PoolTransaction[];
}

export async function donateToPool(amount: number): Promise<void> {
  const { error } = await supabase.rpc("donate_to_community_pool", { p_amount: amount });
  if (error) throw new Error(error.message);
}

export async function claimFromPool(amount: number): Promise<void> {
  const { error } = await supabase.rpc("claim_from_community_pool", { p_amount: amount });
  if (error) throw new Error(error.message);
}

export function formatClaimWindowLabel(): string {
  return "Friday – Sunday";
}

export { getExchangePartner, isHelperExchange };
