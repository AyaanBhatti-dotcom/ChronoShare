import { supabase } from "./supabase";
import type { ExchangeWithProfiles } from "../types/database";

export async function acceptPost(postId: string): Promise<string> {
  const { data, error } = await supabase.rpc("accept_post", { p_post_id: postId });

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
      created_at, completed_at,
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
      created_at, completed_at,
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

export function getHourImpact(
  postType: "needs" | "offers",
  isAcceptor: boolean,
  hours: number,
): { direction: "earn" | "spend"; amount: number } {
  const earns =
    (postType === "needs" && isAcceptor) || (postType === "offers" && !isAcceptor);
  return { direction: earns ? "earn" : "spend", amount: hours };
}
