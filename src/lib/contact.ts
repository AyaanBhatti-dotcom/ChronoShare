import { supabase } from "./supabase";

export async function fetchMemberContactEmail(input: {
  memberId: string;
  postId?: string;
  exchangeId?: string;
}): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_member_contact_email", {
    p_member_id: input.memberId,
    p_post_id: input.postId ?? null,
    p_exchange_id: input.exchangeId ?? null,
  });

  if (error) throw new Error(error.message);

  const email = typeof data === "string" ? data.trim() : "";
  return email || null;
}
