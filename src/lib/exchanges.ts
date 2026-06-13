import { supabase } from "./supabase";
import type { ExchangeWithProfiles } from "../types/database";

import type { ExchangeFormatResolved } from "./exchange-format";

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

export async function completeExchange(exchangeId: string): Promise<void> {
  const { error } = await supabase.rpc("complete_exchange", { p_exchange_id: exchangeId });
  if (error) throw new Error(error.message);
}

export async function cancelExchange(exchangeId: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_exchange", { p_exchange_id: exchangeId });
  if (error) throw new Error(error.message);
}

export async function fetchMyExchanges(userId: string): Promise<ExchangeWithProfiles[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select(`
      id, post_id, poster_id, acceptor_id, title, category, post_type, hours, status,
      created_at, completed_at, exchange_format,
      poster:profiles!exchanges_poster_id_fkey(full_name),
      acceptor:profiles!exchanges_acceptor_id_fkey(full_name)
    `)
    .or(`poster_id.eq.${userId},acceptor_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ExchangeWithProfiles[];
}

export async function fetchRecentExchanges(userId: string, limit = 5): Promise<ExchangeWithProfiles[]> {
  const { data, error } = await supabase
    .from("exchanges")
    .select(`
      id, post_id, poster_id, acceptor_id, title, category, post_type, hours, status,
      created_at, completed_at, exchange_format,
      poster:profiles!exchanges_poster_id_fkey(full_name),
      acceptor:profiles!exchanges_acceptor_id_fkey(full_name)
    `)
    .or(`poster_id.eq.${userId},acceptor_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as ExchangeWithProfiles[];
}

export function getExchangePartner(
  exchange: ExchangeWithProfiles,
  userId: string,
): { name: string; role: "helper" | "recipient" } {
  const isPoster = exchange.poster_id === userId;

  if (exchange.post_type === "needs") {
    return {
      name: isPoster
        ? (exchange.acceptor?.full_name ?? "Community member")
        : (exchange.poster?.full_name ?? "Community member"),
      role: isPoster ? "recipient" : "helper",
    };
  }

  return {
    name: isPoster
      ? (exchange.acceptor?.full_name ?? "Community member")
      : (exchange.poster?.full_name ?? "Community member"),
    role: isPoster ? "helper" : "recipient",
  };
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
