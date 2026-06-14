import { useEffect, useState } from "react";
import { X, MapPin, Clock, ShieldCheck, User } from "lucide-react";
import { getInitials } from "../context/AuthContext";
import { fetchPublicProfile, formatMemberLabel, formatPublicLocation, getMemberDisplayName, type PublicMemberProfile } from "../../lib/profile";

interface MemberProfileModalProps {
  userId: string | null;
  roleLabel?: string;
  onClose: () => void;
}

function formatMemberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function MemberProfileModal({ userId, roleLabel, onClose }: MemberProfileModalProps) {
  const [profile, setProfile] = useState<PublicMemberProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicProfile(userId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setError("Profile not found.");
          setProfile(null);
          return;
        }
        setProfile(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load profile");
        setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 dash-modal-overlay" onClick={onClose} />
      <div className="dash-modal relative w-full max-w-sm rounded-2xl p-6 space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 dash-subtext hover:dash-heading transition-colors"
          aria-label="Close profile"
        >
          <X size={18} />
        </button>

        {roleLabel && (
          <p className="text-[10px] font-bold uppercase tracking-wider dash-subtext">{roleLabel}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 py-6 text-center">{error}</p>
        ) : profile ? (
          <>
            <div className="flex items-start gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover flex-shrink-0 border border-white/80"
                />
              ) : (
                <div className="dash-avatar w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {getInitials(getMemberDisplayName(profile))}
                </div>
              )}
              <div className="min-w-0 pt-1">
                <h3 className="text-lg font-bold dash-heading truncate">
                  {formatMemberLabel(profile)}
                </h3>
                {profile.full_name && (
                  <p className="text-sm dash-subtext">{profile.full_name}</p>
                )}
                {profile.mfa_enabled && (
                  <span className="inline-flex items-center gap-1 mt-2 dash-badge-earn px-2 py-0.5 rounded-full text-[10px] font-medium">
                    <ShieldCheck size={10} />
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="member-profile-row">
                <MapPin size={14} className="dash-accent flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide dash-subtext">Location</p>
                  <p className="text-sm dash-heading">{formatPublicLocation(profile)}</p>
                </div>
              </div>
              <div className="member-profile-row">
                <Clock size={14} className="dash-accent flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide dash-subtext">Hour balance</p>
                  <p className="text-sm dash-heading" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {profile.hours_available.toFixed(1)} hours
                  </p>
                </div>
              </div>
              <div className="member-profile-row">
                <User size={14} className="dash-accent flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wide dash-subtext">Member since</p>
                  <p className="text-sm dash-heading">{formatMemberSince(profile.created_at)}</p>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
