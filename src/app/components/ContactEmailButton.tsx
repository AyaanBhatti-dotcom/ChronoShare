import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import {
  buildExchangeMailto,
  buildListingMailto,
  fetchMemberContactEmail,
} from "../../lib/contact";

interface ContactEmailButtonProps {
  memberId: string;
  memberName: string;
  postId?: string;
  exchangeId?: string;
  listingTitle?: string;
  postType?: "needs" | "offers";
  className?: string;
}

export function ContactEmailButton({
  memberId,
  memberName,
  postId,
  exchangeId,
  listingTitle,
  postType,
  className = "dash-btn-outline w-full py-2.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5",
}: ContactEmailButtonProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setEmail(null);

    fetchMemberContactEmail({ memberId, postId, exchangeId })
      .then((address) => {
        if (!cancelled) setEmail(address);
      })
      .catch(() => {
        if (!cancelled) setEmail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [memberId, postId, exchangeId]);

  if (loading || !email) return null;

  const firstName = memberName.trim().split(/\s+/)[0] || "them";
  const href =
    postId && listingTitle && postType
      ? buildListingMailto(email, listingTitle, postType)
      : buildExchangeMailto(email, listingTitle ?? "your exchange", firstName);

  return (
    <a
      href={href}
      className={className}
      aria-label={`Email ${memberName}`}
    >
      <Mail size={14} />
      Email {firstName}
    </a>
  );
}
