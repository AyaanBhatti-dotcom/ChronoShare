import { useState } from "react";
import { Droplets, Gift } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getInitials } from "../context/AuthContext";
import { MemberProfileModal } from "../MemberProfileModal";
import { dashColors } from "../onboarding/aeroTheme";
import type { PoolTransaction } from "../../lib/community-pool";

function formatActivityTimestamp(iso: string): { primary: string; relative: string } {
  const date = new Date(iso);
  const now = new Date();
  const includeYear = date.getFullYear() !== now.getFullYear();

  const primary = date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" as const } : {}),
    hour: "numeric",
    minute: "2-digit",
  });

  const relative = formatDistanceToNow(date, { addSuffix: true });

  return { primary, relative };
}

interface PoolActivityFeedProps {
  activity: PoolTransaction[];
}

export function PoolActivityFeed({ activity }: PoolActivityFeedProps) {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const donations = activity.filter((tx) => tx.transaction_type === "donation");
  const claims = activity.filter((tx) => tx.transaction_type === "claim");

  return (
    <>
      {donations.length > 0 && (
        <div className="pool-activity-group">
          <p className="pool-activity-group-label">
            <Gift size={13} />
            Recent donors
          </p>
          <ul className="pool-activity-list">
            {donations.map((tx) => (
              <ActivityRow
                key={tx.id}
                tx={tx}
                onOpenProfile={tx.user_id ? () => setProfileUserId(tx.user_id) : undefined}
              />
            ))}
          </ul>
        </div>
      )}

      {claims.length > 0 && (
        <div className={`pool-activity-group ${donations.length > 0 ? "pool-activity-group-spaced" : ""}`}>
          <p className="pool-activity-group-label">
            <Droplets size={13} />
            Recent claims
          </p>
          <ul className="pool-activity-list">
            {claims.map((tx) => (
              <ActivityRow
                key={tx.id}
                tx={tx}
                onOpenProfile={tx.user_id ? () => setProfileUserId(tx.user_id) : undefined}
              />
            ))}
          </ul>
        </div>
      )}

      <MemberProfileModal
        userId={profileUserId}
        roleLabel="Pool contributor"
        onClose={() => setProfileUserId(null)}
      />
    </>
  );
}

function ActivityRow({
  tx,
  onOpenProfile,
}: {
  tx: PoolTransaction;
  onOpenProfile?: () => void;
}) {
  const isDonation = tx.transaction_type === "donation";
  const name = tx.profiles?.full_name ?? "Community member";
  const { primary, relative } = formatActivityTimestamp(tx.created_at);
  const interactive = Boolean(onOpenProfile);

  return (
    <li>
      <div
        className={`pool-activity-row ${isDonation ? "pool-activity-row-donate" : "pool-activity-row-claim"}`}
      >
        <button
          type="button"
          onClick={onOpenProfile}
          disabled={!interactive}
          className={`pool-activity-avatar-wrap ${interactive ? "pool-activity-avatar-wrap-interactive" : ""}`}
          aria-label={interactive ? `View ${name}'s profile` : undefined}
        >
          {tx.profiles?.avatar_url ? (
            <img src={tx.profiles.avatar_url} alt="" className="pool-activity-avatar-img" />
          ) : (
            <span className="pool-activity-avatar-fallback dash-avatar">{getInitials(name)}</span>
          )}
        </button>

        <div className="pool-activity-body min-w-0 flex-1">
          <p className="pool-activity-name truncate">{name}</p>
          <p className="pool-activity-action">
            {isDonation ? "Donated to the pool" : "Claimed from the pool"}
          </p>
          <p className="pool-activity-when">
            <time dateTime={tx.created_at}>{primary}</time>
            <span className="pool-activity-when-dot" aria-hidden>
              ·
            </span>
            <span>{relative}</span>
          </p>
        </div>

        <span
          className={`pool-activity-amount ${isDonation ? "pool-activity-amount-donate" : "pool-activity-amount-claim"}`}
          style={isDonation ? { color: dashColors.earn } : { color: dashColors.spend }}
        >
          {isDonation ? "+" : "−"}
          {Number(tx.amount).toFixed(1)}h
        </span>
      </div>
    </li>
  );
}
