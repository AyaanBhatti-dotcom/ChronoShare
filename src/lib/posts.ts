import { supabase } from "./supabase";
import type { Post, PostWithAuthor } from "../types/database";
import type { UserLocation } from "./location";

const POST_SELECT =
  "id, user_id, title, description, category, post_type, hours_cost, status, city, region, state, country, latitude, longitude, created_at, profiles(full_name)";

export async function fetchActivePosts(): Promise<PostWithAuthor[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PostWithAuthor[];
}

export async function fetchActivePostCount(): Promise<number> {
  const { count, error } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (error) return 0;
  return count ?? 0;
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
  location?: UserLocation | null;
}): Promise<void> {
  const { error } = await supabase.from("posts").insert({
    user_id: input.userId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    post_type: input.postType,
    hours_cost: input.hoursCost,
    city: input.location?.city ?? null,
    region: input.location?.region ?? null,
    state: input.location?.state ?? null,
    country: input.location?.country ?? null,
    latitude: input.location?.latitude ?? null,
    longitude: input.location?.longitude ?? null,
  });

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
