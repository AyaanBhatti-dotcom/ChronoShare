import { supabase } from "./supabase";
import type { AdminPost, AdminProfile, LanguageRequest } from "../types/database";

const ADMIN_KEY_STORAGE = "chronoshare_admin_key";

/** Clears any legacy persisted admin key from older sessions. */
export function clearAdminKey() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}

export async function verifyAdminKey(key: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("admin_verify_key", { p_key: key });
  if (error) {
    console.warn("Admin key verification failed:", error.message);
    return false;
  }
  return data === true;
}

export async function fetchAdminProfiles(key: string): Promise<AdminProfile[]> {
  const { data, error } = await supabase.rpc("admin_list_profiles", { p_key: key });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminProfile[];
}

export async function fetchAdminPosts(key: string): Promise<AdminPost[]> {
  const { data, error } = await supabase.rpc("admin_list_posts", { p_key: key });
  if (error) throw new Error(error.message);
  return (data ?? []) as AdminPost[];
}

export async function updateAdminPostStatus(
  key: string,
  postId: string,
  status: "active" | "closed" | "archived",
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_post_status", {
    p_key: key,
    p_post_id: postId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
}

export interface AdminUpdateProfileInput {
  fullName?: string;
  email?: string;
  hoursAvailable?: number;
}

export async function updateAdminProfile(
  key: string,
  userId: string,
  input: AdminUpdateProfileInput,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_profile", {
    p_key: key,
    p_user_id: userId,
    p_full_name: input.fullName ?? null,
    p_email: input.email ?? null,
    p_hours_available: input.hoursAvailable ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteAdminUser(key: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", {
    p_key: key,
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
}

export interface AdminUpdatePostInput {
  title?: string;
  description?: string | null;
  category?: string;
  postType?: "needs" | "offers";
  hoursCost?: number;
  status?: "active" | "closed" | "archived";
}

export async function updateAdminPost(
  key: string,
  postId: string,
  input: AdminUpdatePostInput,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_post", {
    p_key: key,
    p_post_id: postId,
    p_title: input.title ?? null,
    p_description: input.description ?? null,
    p_category: input.category ?? null,
    p_post_type: input.postType ?? null,
    p_hours_cost: input.hoursCost ?? null,
    p_status: input.status ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteAdminPost(key: string, postId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_post", {
    p_key: key,
    p_post_id: postId,
  });
  if (error) throw new Error(error.message);
}

export async function fetchAdminLanguageRequests(key: string): Promise<LanguageRequest[]> {
  const { data, error } = await supabase.rpc("admin_list_language_requests", { p_key: key });
  if (error) throw new Error(error.message);
  return (data ?? []) as LanguageRequest[];
}

export async function updateAdminLanguageRequest(
  key: string,
  requestId: string,
  updates: { status?: LanguageRequest["status"]; adminRead?: boolean },
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_language_request", {
    p_key: key,
    p_request_id: requestId,
    p_status: updates.status ?? null,
    p_admin_read: updates.adminRead ?? null,
  });
  if (error) throw new Error(error.message);
}
