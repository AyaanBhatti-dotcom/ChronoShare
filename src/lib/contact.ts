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

export function buildListingMailto(
  email: string,
  listingTitle: string,
  postType: "needs" | "offers",
): string {
  const role = postType === "needs" ? "help with" : "offer for";
  const subject = encodeURIComponent(`ChronoShare: ${listingTitle}`);
  const body = encodeURIComponent(
    `Hi,\n\nI'm interested in your ChronoShare listing "${listingTitle}" (${role}).\n\n`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function buildExchangeMailto(
  email: string,
  exchangeTitle: string,
  partnerFirstName: string,
): string {
  const subject = encodeURIComponent(`ChronoShare exchange: ${exchangeTitle}`);
  const body = encodeURIComponent(
    `Hi ${partnerFirstName},\n\nI'd like to coordinate our ChronoShare exchange "${exchangeTitle}".\n\n`,
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
