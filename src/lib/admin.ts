import { supabase } from "./supabase";
import type { AdminPost, AdminProfile } from "../types/database";

const ADMIN_KEY_STORAGE = "chronoshare_admin_key";

export function getAdminKey(): string | null {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE);
}

export function setAdminKey(key: string) {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
}

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
