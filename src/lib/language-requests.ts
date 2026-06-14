import { supabase } from "./supabase";
import type { LanguageRequest } from "../types/database";

export type { LanguageRequest };

export async function submitLanguageRequest(
  languageName: string,
  reason?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("submit_language_request", {
    p_language_name: languageName.trim(),
    p_reason: reason?.trim() || null,
  });

  if (error) {
    if (error.message.includes("submit_language_request")) {
      throw new Error(
        "Language requests are not set up yet. Run migration 022_language_requests in Supabase.",
      );
    }
    throw new Error(error.message);
  }

  return data as string;
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
