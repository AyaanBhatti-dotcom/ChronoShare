import { supabase } from "./supabase";
import type { Exchange, ExchangeWithProfiles } from "../types/database";
import type { PostExchangeInfo } from "./listing-status";
import { getMemberDisplayName } from "./profile";

import type { ExchangeFormatResolved } from "./exchange-format";

const EXCHANGE_SELECT = `
  id, post_id, poster_id, acceptor_id, title, category, post_type, hours, status,
  created_at, completed_at, exchange_format,
  poster_confirmed_at, acceptor_confirmed_at, hours_settled
`;

async function attachExchangeProfiles(exchanges: Exchange[]): Promise<ExchangeWithProfiles[]> {
  if (exchanges.length === 0) return [];

  const profileIds = [
    ...new Set(exchanges.flatMap((ex) => [ex.poster_id, ex.acceptor_id])),
  ];

  const { data, error } = await supabase
    .from("member_profiles")
    .select("id, full_name, username")
    .in("id", profileIds);

  if (error) throw new Error(error.message);

  const byId = new Map(
    (data ?? []).map((profile) => [
      profile.id,
      { full_name: profile.full_name, username: profile.username },
    ]),
  );

  return exchanges.map((ex) => ({
    ...ex,
    poster: byId.get(ex.poster_id) ?? null,
    acceptor: byId.get(ex.acceptor_id) ?? null,
  }));
}

export async function acceptPost(
  postId: string,
  exchangeFormat?: ExchangeFormatResolved,
): Promise<string> {
  const { data, error } = await supabase.rpc("accept_post", {
    p_post_id: postId,
    p_exchange_format: exchangeFormat ?? null,
  });

  if (error) throw new Error(error.message);
  return data as string;
}

export async function confirmExchange(exchangeId: string): Promise<void> {
  const { error } = await supabase.rpc("confirm_exchange", { p_exchange_id: exchangeId });
  if (error) throw new Error(error.message);
}

/** @deprecated Use confirmExchange — kept for compatibility */
export async function completeExchange(exchangeId: string): Promise<void> {
  return confirmExchange(exchangeId);
}

export async function cancelExchange(exchangeId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_exchange", { p_exchange_id: exchangeId });
  if (error) throw new Error(error.message);
}

export async function fetchMyExchanges(userId: string): Promise<ExchangeWithProfiles[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select(EXCHANGE_SELECT)
    .or(`poster_id.eq.${userId},acceptor_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return attachExchangeProfiles((data ?? []) as Exchange[]);
}

export async function fetchPendingExchanges(userId: string): Promise<ExchangeWithProfiles[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select(EXCHANGE_SELECT)
    .or(`poster_id.eq.${userId},acceptor_id.eq.${userId}`)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return attachExchangeProfiles((data ?? []) as Exchange[]);
}

/** Post IDs the user has already joined and are still awaiting confirmation. */
export async function fetchUserJoinedPostIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select("post_id")
    .eq("acceptor_id", userId)
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.post_id as string);
}

/** Post IDs with a pending or completed exchange — no longer open on the job board. */
export async function fetchMatchedPostIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select("post_id")
    .in("status", ["pending", "completed"]);

  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((row) => row.post_id as string))];
}

export async function fetchExchangeInfoForPosts(
  postIds: string[],
): Promise<Map<string, PostExchangeInfo>> {
  if (postIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("exchanges")
    .select("post_id, status, created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const map = new Map<string, PostExchangeInfo>();
  for (const row of data ?? []) {
    const postId = row.post_id as string;
    if (map.has(postId)) continue;
    map.set(postId, {
      postId,
      status: row.status as PostExchangeInfo["status"],
    });
  }
  return map;
}

export async function fetchRecentExchanges(userId: string, limit = 5): Promise<ExchangeWithProfiles[]> {
  const data = await fetchCompletedExchanges(userId);
  return data.slice(0, limit);
}

export async function fetchCompletedExchanges(userId: string): Promise<ExchangeWithProfiles[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select(EXCHANGE_SELECT)
    .or(`poster_id.eq.${userId},acceptor_id.eq.${userId}`)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  if (error) throw new Error(error.message);
  return attachExchangeProfiles((data ?? []) as Exchange[]);
}

export function getExchangePartner(
  exchange: ExchangeWithProfiles,
  userId: string,
): { name: string; role: "helper" | "recipient" } {
  const isPoster = exchange.poster_id === userId;
  const partnerProfile = isPoster ? exchange.acceptor : exchange.poster;

  if (exchange.post_type === "needs") {
    return {
      name: getMemberDisplayName(partnerProfile),
      role: isPoster ? "recipient" : "helper",
    };
  }

  return {
    name: getMemberDisplayName(partnerProfile),
    role: isPoster ? "helper" : "recipient",
  };
}

export function getExchangePartnerId(exchange: Exchange, userId: string): string {
  return exchange.poster_id === userId ? exchange.acceptor_id : exchange.poster_id;
}

export function getExchangePartnerLabel(
  exchange: Pick<Exchange, "post_type" | "poster_id">,
  userId: string,
): string {
  const isPoster = exchange.poster_id === userId;
  if (exchange.post_type === "offers") {
    return isPoster ? "Skill requester" : "Skill provider";
  }
  return isPoster ? "Helper" : "Requester";
}

export function hasUserConfirmed(exchange: ExchangeWithProfiles, userId: string): boolean {
  if (exchange.poster_id === userId) return exchange.poster_confirmed_at != null;
  if (exchange.acceptor_id === userId) return exchange.acceptor_confirmed_at != null;
  return false;
}

export function isPartnerConfirmed(exchange: ExchangeWithProfiles, userId: string): boolean {
  if (exchange.poster_id === userId) return exchange.acceptor_confirmed_at != null;
  if (exchange.acceptor_id === userId) return exchange.poster_confirmed_at != null;
  return false;
}

export function bothConfirmed(exchange: ExchangeWithProfiles): boolean {
  return exchange.poster_confirmed_at != null && exchange.acceptor_confirmed_at != null;
}

export type HourImpactDirection = "earn" | "spend" | "free";

export interface HourImpact {
  direction: HourImpactDirection;
  amount: number;
}

/** Hour impact for someone joining a listing on the job board. */
export function getHourImpact(
  postType: "needs" | "offers",
  isAcceptor: boolean,
  hours: number,
): HourImpact {
  if (postType === "needs" && isAcceptor) {
    return { direction: "earn", amount: hours };
  }
  if (postType === "offers" && isAcceptor) {
    return { direction: "free", amount: hours };
  }
  if (postType === "needs" && !isAcceptor) {
    return { direction: "spend", amount: hours };
  }
  return { direction: "earn", amount: hours };
}

export function formatHourImpactLabel(impact: HourImpact): string {
  if (impact.direction === "free") return "Free";
  if (impact.direction === "earn") return `Earn ${impact.amount}h`;
  return `Spend ${impact.amount}h`;
}

export function getExchangeHourType(
  exchange: { post_type: "needs" | "offers"; poster_id: string; acceptor_id: string },
  userId: string,
): "earned" | "spent" | "free" {
  if (exchange.post_type === "needs" && exchange.acceptor_id === userId) return "earned";
  if (exchange.post_type === "needs" && exchange.poster_id === userId) return "spent";
  if (exchange.post_type === "offers" && exchange.poster_id === userId) return "earned";
  return "free";
}
