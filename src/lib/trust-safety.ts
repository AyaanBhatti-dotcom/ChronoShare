import { supabase } from "./supabase";

export type ReportCategory =
  | "no_show"
  | "incomplete_work"
  | "harassment"
  | "unsafe"
  | "scam"
  | "other";

export type ExchangeReportStatus = "pending" | "reviewed" | "action_taken" | "dismissed";

export interface ExchangeReport {
  id: string;
  reporter_id: string | null;
  reported_user_id: string;
  exchange_id: string | null;
  category: ReportCategory;
  details: string | null;
  also_block: boolean;
  status: ExchangeReportStatus;
  admin_read: boolean;
  created_at: string;
}

export interface MemberTrustStats {
  completedExchanges: number;
  reviewCount: number;
  positiveRatingPct: number | null;
  showRating: boolean;
}

export interface ExchangeReviewInput {
  showedUp?: boolean | null;
  workCompleted?: boolean | null;
  wouldExchangeAgain?: boolean | null;
  feltSafe?: boolean | null;
  details?: string | null;
}

export const REPORT_CATEGORIES: { id: ReportCategory; label: string; description: string }[] = [
  { id: "no_show", label: "No-show", description: "Did not show up or respond" },
  { id: "incomplete_work", label: "Incomplete work", description: "Did not finish what was agreed" },
  { id: "harassment", label: "Harassment", description: "Rude, threatening, or inappropriate behavior" },
  { id: "unsafe", label: "Felt unsafe", description: "Situation felt unsafe or uncomfortable" },
  { id: "scam", label: "Scam or fraud", description: "Attempted to cheat or mislead" },
  { id: "other", label: "Other", description: "Something else worth flagging" },
];

export async function submitExchangeReport(input: {
  reportedUserId: string;
  category: ReportCategory;
  exchangeId?: string | null;
  details?: string | null;
  alsoBlock?: boolean;
}): Promise<string> {
  const { data, error } = await supabase.rpc("submit_exchange_report", {
    p_reported_user_id: input.reportedUserId,
    p_category: input.category,
    p_exchange_id: input.exchangeId ?? null,
    p_details: input.details ?? null,
    p_also_block: input.alsoBlock ?? false,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function submitExchangeReview(
  exchangeId: string,
  input: ExchangeReviewInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("submit_exchange_review", {
    p_exchange_id: exchangeId,
    p_showed_up: input.showedUp ?? null,
    p_work_completed: input.workCompleted ?? null,
    p_would_exchange_again: input.wouldExchangeAgain ?? null,
    p_felt_safe: input.feltSafe ?? null,
    p_details: input.details ?? null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function blockUser(blockedId: string): Promise<void> {
  const { error } = await supabase.rpc("block_user", { p_blocked_id: blockedId });
  if (error) throw new Error(error.message);
}

export async function unblockUser(blockedId: string): Promise<void> {
  const { error } = await supabase.rpc("unblock_user", { p_blocked_id: blockedId });
  if (error) throw new Error(error.message);
}

export async function fetchBlockedUserIds(): Promise<string[]> {
  const { data, error } = await supabase.rpc("list_blocked_user_ids");
  if (error) {
    if (error.code === "PGRST202") return [];
    throw new Error(error.message);
  }
  return (data ?? []) as string[];
}

export async function fetchMemberTrustStats(userId: string): Promise<MemberTrustStats | null> {
  const { data, error } = await supabase.rpc("get_member_trust_stats", {
    p_user_id: userId,
  });

  if (error) {
    if (error.code === "PGRST202") return null;
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    completedExchanges: Number(row.completed_exchanges ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    positiveRatingPct:
      row.positive_rating_pct != null ? Number(row.positive_rating_pct) : null,
    showRating: Boolean(row.show_rating),
  };
}

export async function hasExchangeReview(exchangeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_exchange_review", {
    p_exchange_id: exchangeId,
  });

  if (error) {
    if (error.code === "PGRST202") return false;
    throw new Error(error.message);
  }

  return data === true;
}
