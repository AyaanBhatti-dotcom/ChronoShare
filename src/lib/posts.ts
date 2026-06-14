import { supabase } from "./supabase";
import type { Post, PostWithAuthor } from "../types/database";
import type { ExchangeFormatPreference } from "./exchange-format";
import type { UserLocation } from "./location";
import { fetchMatchedPostIds } from "./exchanges";

const POST_SELECT =
  "id, user_id, title, description, category, post_type, hours_cost, status, city, region, state, country, latitude, longitude, exchange_format, created_at, profiles(full_name)";

export async function fetchActivePosts(): Promise<PostWithAuthor[]> {
  const matchedPostIds = await fetchMatchedPostIds();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (matchedPostIds.length > 0) {
    query = query.not("id", "in", `(${matchedPostIds.join(",")})`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []) as PostWithAuthor[];
}

export async function fetchActivePostCount(): Promise<number> {
  const posts = await fetchActivePosts();
  return posts.length;
}

export async function fetchMyPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPost(input: {
  userId: string;
  title: string;
  description: string | null;
  category: string;
  postType: "needs" | "offers";
  hoursCost: number;
  exchangeFormat: ExchangeFormatPreference;
  location?: UserLocation | null;
}): Promise<void> {
  const { error } = await supabase.from("posts").insert({
    user_id: input.userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    post_type: input.postType,
    hours_cost: input.hoursCost,
    exchange_format: input.exchangeFormat,
    city: input.location?.city ?? null,
    region: input.location?.region ?? null,
    state: input.location?.state ?? null,
    country: input.location?.country ?? null,
    latitude: input.location?.latitude ?? null,
    longitude: input.location?.longitude ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function updatePost(
  postId: string,
  input: {
    title?: string;
    description?: string | null;
    category?: string;
    postType?: "needs" | "offers";
    hoursCost?: number;
    exchangeFormat?: ExchangeFormatPreference;
  },
): Promise<void> {
  const matchedPostIds = await fetchMatchedPostIds();
  if (matchedPostIds.includes(postId)) {
    throw new Error("This listing is matched in an exchange and can't be edited.");
  }

  const updates: Record<string, unknown> = {};
  if (input.title !== undefined) updates.title = input.title.trim();
  if (input.description !== undefined) updates.description = input.description?.trim() || null;
  if (input.category !== undefined) updates.category = input.category;
  if (input.postType !== undefined) updates.post_type = input.postType;
  if (input.hoursCost !== undefined) updates.hours_cost = input.hoursCost;
  if (input.exchangeFormat !== undefined) updates.exchange_format = input.exchangeFormat;

  const { error } = await supabase.from("posts").update(updates).eq("id", postId);

  if (error) throw new Error(error.message);
}

export async function closePost(postId: string): Promise<void> {
  const { error } = await supabase
    .from("posts")
    .update({ status: "closed" })
    .eq("id", postId);

  if (error) throw new Error(error.message);
}

export async function reopenPost(postId: string): Promise<void> {
  const matchedPostIds = await fetchMatchedPostIds();
  if (matchedPostIds.includes(postId)) {
    throw new Error("This listing was matched in an exchange and can't be reopened.");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "active" })
    .eq("id", postId);

  if (error) throw new Error(error.message);
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) {
    if (error.code === "23503") {
      throw new Error("This listing was matched in an exchange and can't be deleted.");
    }
    throw new Error(error.message);
  }
}
