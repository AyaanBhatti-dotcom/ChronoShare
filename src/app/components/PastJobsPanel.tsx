import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, User,
} from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import {
  fetchCompletedExchanges,
  getExchangePartner,
  getExchangePartnerId,
  getExchangePartnerLabel,
  getExchangeHourType,
} from "../../lib/exchanges";
import { formatMemberLabel } from "../../lib/profile";
import type { ExchangeWithProfiles } from "../../types/database";
import { dashColors } from "./onboarding/aeroTheme";
import { formatExchangeFormat } from "../../lib/exchange-format";
import { MemberProfileModal } from "./MemberProfileModal";

const categories = ["All", "Tech", "Labor", "Education", "Music", "Cooking", "Design"];

const categoryIcon = (cat: string) => {
  const map: Record<string, React.ReactNode> = {
    Tech: <Monitor size={14} />,
    Labor: <Wrench size={14} />,
    Education: <BookOpen size={14} />,
    Music: <Music size={14} />,
    Cooking: <ChefHat size={14} />,
    Design: <Palette size={14} />,
  };
  return map[cat] || <Monitor size={14} />;
};

type PastMode = "all" | "needs" | "offers";

function formatCompletedDate(iso: string | null) {
  if (!iso) return "Date unknown";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PastJobsPanelProps {
  mode: PastMode;
  category: string;
  search: string;
}

export function PastJobsPanel({ mode, category, search }: PastJobsPanelProps) {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<ExchangeWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [viewingMemberLabel, setViewingMemberLabel] = useState<string | undefined>();

  const loadPastJobs = useCallback(async () => {
    if (!user) {
      setExchanges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchCompletedExchanges(user.userId);
      setExchanges(data);
    } catch (err) {
      console.warn("Could not load past jobs:", err);
      setExchanges([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPastJobs();
  }, [loadPastJobs]);

  const filtered = useMemo(() => {
    return exchanges.filter((ex) => {
      const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
      const matchMode = mode === "all" || ex.post_type === mode;
      const matchCat = category === "All" || ex.category === category;
      const matchSearch =
        !search ||
        ex.title.toLowerCase().includes(search.toLowerCase()) ||
        partner.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.category.toLowerCase().includes(search.toLowerCase());
      return matchMode && matchCat && matchSearch;
    });
  }, [exchanges, user, mode, category, search]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="dash-card text-center py-16 rounded-2xl">
        <CheckCircle2 size={28} className="mx-auto mb-3 dash-subtext opacity-60" />
        <p className="dash-subtext text-sm mb-1">No past jobs yet.</p>
        <p className="text-xs dash-subtext opacity-80">
          Completed exchanges show up here after both people confirm.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((ex) => {
          if (!user) return null;

          const partner = getExchangePartner(ex, user.userId);
          const partnerProfile = ex.poster_id === user.userId ? ex.acceptor : ex.poster;
          const partnerLabel = formatMemberLabel(partnerProfile);
          const hourType = getExchangeHourType(ex, user.userId);
          const roleLabel = getExchangePartnerLabel(ex, user.userId);
          const completedDate = formatCompletedDate(ex.completed_at ?? ex.created_at);

          return (
            <article
              key={ex.id}
              className="dash-card rounded-2xl p-5 flex flex-col gap-4 text-left"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setViewingMemberId(getExchangePartnerId(ex, user.userId));
                    setViewingMemberLabel(roleLabel);
                  }}
                  className="dash-avatar w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 hover:opacity-90 transition-opacity"
                  aria-label={`View ${partner.name}'s profile`}
                >
                  {getInitials(partner.name)}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-xs dash-subtext">{partnerLabel}</p>
                    <span className="dash-badge-neutral text-[10px] px-2 py-0.5 rounded-full font-medium capitalize">
                      {ex.post_type === "needs" ? "Need help" : "Offering"}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold dash-heading leading-snug">{ex.title}</h3>
                  <p className="text-[10px] dash-subtext mt-1">{roleLabel}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs dash-subtext">
                <span className="inline-flex items-center gap-1 dash-badge-neutral px-2 py-0.5 rounded-full">
                  {categoryIcon(ex.category)}
                  {ex.category}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {completedDate}
                </span>
                {ex.exchange_format && (
                  <span>{formatExchangeFormat(ex.exchange_format)}</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t dash-divider">
                <span className="text-xs dash-subtext flex items-center gap-1">
                  <CheckCircle2 size={12} className="dash-accent-grass" />
                  Completed
                </span>
                <span
                  className="text-sm font-semibold flex items-center gap-1"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    color:
                      hourType === "earned"
                        ? dashColors.earn
                        : hourType === "spent"
                          ? dashColors.spend
                          : dashColors.neutral,
                  }}
                >
                  {hourType === "earned" ? (
                    <ArrowUpRight size={14} />
                  ) : hourType === "spent" ? (
                    <ArrowDownRight size={14} />
                  ) : null}
                  {hourType === "free" ? "Free" : `${hourType === "earned" ? "+" : "-"}${ex.hours}h`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setViewingMemberId(getExchangePartnerId(ex, user.userId));
                  setViewingMemberLabel(roleLabel);
                }}
                className="dash-btn-outline w-full py-2 rounded-full text-xs font-medium flex items-center justify-center gap-1.5"
              >
                <User size={13} />
                View {partnerLabel}&apos;s profile
              </button>
            </article>
          );
        })}
      </div>

      <MemberProfileModal
        userId={viewingMemberId}
        roleLabel={viewingMemberLabel}
        onClose={() => {
          setViewingMemberId(null);
          setViewingMemberLabel(undefined);
        }}
      />
    </>
  );
}
