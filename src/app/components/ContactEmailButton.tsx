import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMemberContactEmail } from "../../lib/contact";

interface ContactEmailButtonProps {
  memberId: string;
  exchangeId: string;
  username?: string | null;
  className?: string;
}

function contactLabel(username?: string | null): string {
  const handle = username?.trim();
  return handle ? `Email (${handle})` : "Email (member)";
}

export function ContactEmailButton({
  memberId,
  exchangeId,
  username,
  className,
}: ContactEmailButtonProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setEmail(null);

    fetchMemberContactEmail({ memberId, exchangeId })
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
  }, [memberId, exchangeId]);

  if (loading || !email) return null;

  return (
    <div
      className={
        className ??
        "rounded-xl border dash-divider bg-white/5 px-4 py-3 space-y-1.5"
      }
    >
      <div className="flex items-center gap-1.5 text-xs font-medium dash-heading">
        <Mail size={14} className="dash-accent flex-shrink-0" />
        {contactLabel(username)}
      </div>
      <p className="text-sm dash-heading break-all select-all leading-snug">
        {email}
      </p>
    </div>
  );
}
