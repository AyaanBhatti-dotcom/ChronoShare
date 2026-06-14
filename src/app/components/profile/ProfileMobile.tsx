import { type ReactNode, useState } from "react";
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  Briefcase,
  FolderOpen,
  ClipboardList,
  History,
  PlusCircle,
  UserCircle,
} from "lucide-react";
import { getInitials, type Session } from "../../context/AuthContext";
import type { ExchangeWithProfiles } from "../../../types/database";
import { dashColors } from "../onboarding/aeroTheme";
import { formatExchangeFormat } from "../../../lib/exchange-format";
import {
  getExchangePartner,
  getExchangePartnerLabel,
  hasUserConfirmed,
  isPartnerConfirmed,
} from "../../../lib/exchanges";
import { MyListingsPanel } from "../MyListingsPanel";
import { MemberProfileModal } from "../MemberProfileModal";
import type { BoardTab } from "../JobBoard";

type HistoryTab = "all" | "given" | "received";
type MobileSection = "overview" | "pending" | "history" | "listings";

type HistoryItem = {
  id: string;
  hourType: "earned" | "spent" | "free";
  type: "given" | "received" | "free";
  name: string;
  task: string;
  hours: number;
  date: string;
  raw: ExchangeWithProfiles;
};

type ProfileNavigateOptions = {
  boardTab?: BoardTab;
  postType?: "needs" | "offers";
};

interface ProfileMobileProps {
  user: Session | null;
  isPreview: boolean;
  loading: boolean;
  error: string | null;
  tab: HistoryTab;
  onTabChange: (tab: HistoryTab) => void;
  history: HistoryItem[];
  filtered: HistoryItem[];
  pending: ExchangeWithProfiles[];
  hoursEarned: number;
  hoursSpent: number;
  netHours: number;
  achievements: { icon: ReactNode; label: string; unlocked: boolean }[];
  listingStats: { active: number; total: number };
  solarpunkWeather: { temp: string; label: string; icon: string };
  actionId: string | null;
  onConfirm: (exchangeId: string) => void;
  onCancel: (exchangeId: string) => void;
  onNavigate?: (screen: string, options?: ProfileNavigateOptions) => void;
  onListingStatsChange: (stats: { active: number; total: number }) => void;
}

const SECTIONS: { id: MobileSection; label: string; Icon: typeof FolderOpen }[] = [
  { id: "overview", label: "Overview", Icon: Star },
  { id: "pending", label: "Pending", Icon: Loader2 },
  { id: "history", label: "History", Icon: FolderOpen },
  { id: "listings", label: "Listings", Icon: Briefcase },
];

export function ProfileMobile({
  user,
  isPreview,
  loading,
  error,
  tab,
  onTabChange,
  history,
  filtered,
  pending,
  hoursEarned,
  hoursSpent,
  netHours,
  achievements,
  listingStats,
  solarpunkWeather,
  actionId,
  onConfirm,
  onCancel,
  onNavigate,
  onListingStatsChange,
}: ProfileMobileProps) {
  const [section, setSection] = useState<MobileSection>(
    pending.length > 0 ? "pending" : "overview",
  );
  const [viewingMemberId, setViewingMemberId] = useState<string | null>(null);
  const [viewingMemberLabel, setViewingMemberLabel] = useState<string | undefined>();

  const openMemberProfile = (exchange: ExchangeWithProfiles) => {
    if (!user) return;
    setViewingMemberId(
      exchange.poster_id === user.userId ? exchange.acceptor_id : exchange.poster_id,
    );
    setViewingMemberLabel(getExchangePartnerLabel(exchange, user.userId));
  };

  return (
    <div className="profile-mobile">
      <section className="profile-mobile-hero dash-card rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="dash-avatar w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
            {user ? getInitials(user.name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg font-bold dash-heading truncate">{user?.name ?? "User"}</h2>
              <span className="dash-badge-earn flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium">
                <ShieldCheck size={10} />
                Verified
              </span>
            </div>
            <p className="text-xs dash-subtext truncate">{user?.email}</p>
            {user?.username && (
              <p className="text-xs dash-subtext mt-0.5">@{user.username}</p>
            )}
          </div>
        </div>

        <div className="profile-mobile-balance mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide dash-subtext">Hour balance</p>
          <p className="profile-mobile-balance-value" style={{ fontFamily: "'DM Mono', monospace" }}>
            {user?.hoursAvailable.toFixed(1) ?? "0.0"}
            <span className="text-sm font-medium dash-subtext ml-1">hrs</span>
          </p>
        </div>

        <div className="profile-mobile-stat-grid mt-4">
          {[
            { label: "Trades", value: String(history.length), color: dashColors.earn },
            { label: "Earned", value: `+${hoursEarned.toFixed(1)}h`, color: dashColors.earn },
            { label: "Spent", value: `-${hoursSpent.toFixed(1)}h`, color: dashColors.sun },
            { label: "Net", value: `${netHours >= 0 ? "+" : ""}${netHours.toFixed(1)}h`, color: dashColors.spend },
          ].map((stat) => (
            <div key={stat.label} className="profile-mobile-stat">
              <p className="profile-mobile-stat-value" style={{ color: stat.color, fontFamily: "'DM Mono', monospace" }}>
                {stat.value}
              </p>
              <p className="profile-mobile-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-mobile-actions">
        <button type="button" className="profile-mobile-action" onClick={() => onNavigate?.("board")}>
          <ClipboardList size={18} />
          <span>Job Board</span>
        </button>
        <button
          type="button"
          className="profile-mobile-action"
          onClick={() => onNavigate?.("board", { boardTab: "past" })}
        >
          <History size={18} />
          <span>Past Jobs</span>
        </button>
        <button
          type="button"
          className="profile-mobile-action"
          onClick={() => onNavigate?.("post", { postType: "needs" })}
        >
          <PlusCircle size={18} />
          <span>Post</span>
        </button>
      </section>

      <div className="profile-mobile-nav dash-pill-scroll">
        <div className="dash-pill-group flex rounded-full p-1 min-w-max">
          {SECTIONS.map(({ id, label, Icon }) => {
            const badge = id === "pending" ? pending.length : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={`profile-mobile-nav-item ${section === id ? "dash-pill-active" : "dash-pill-inactive"}`}
              >
                <Icon size={14} className={id === "pending" && badge > 0 ? "animate-spin" : ""} />
                {label}
                {badge > 0 && <span className="profile-mobile-nav-badge">{badge}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
      )}

      <section className="profile-mobile-panel dash-card rounded-2xl overflow-hidden">
        {section === "overview" && (
          <div className="p-4 space-y-4">
            <div className="profile-mobile-overview-card">
              <p className="text-[10px] font-semibold uppercase tracking-wide dash-subtext">Solarpunk weather</p>
              <p className="text-base font-semibold dash-heading mt-1">
                {solarpunkWeather.icon} {solarpunkWeather.temp}
              </p>
              <p className="text-xs dash-subtext mt-0.5">{solarpunkWeather.label}</p>
            </div>
            <div>
              <p className="text-xs font-semibold dash-heading mb-2">Achievements</p>
              <ul className="profile-mobile-achievements">
                {achievements.map((a) => (
                  <li key={a.label} className={a.unlocked ? "unlocked" : "locked"}>
                    {a.icon}
                    <span>{a.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="profile-mobile-overview-card">
              <p className="text-xs font-semibold dash-heading mb-2">Listings snapshot</p>
              <p className="text-sm dash-subtext">
                {listingStats.active} active · {listingStats.total} total on the job board
              </p>
            </div>
          </div>
        )}

        {section === "pending" && (
          <div>
            {pending.length === 0 ? (
              <p className="px-4 py-10 text-sm text-center dash-subtext">No exchanges awaiting confirmation.</p>
            ) : (
              <div className="divide-y dash-divider">
                {pending.map((ex) => {
                  const partner = user ? getExchangePartner(ex, user.userId) : { name: "User", role: "helper" as const };
                  const partnerLabel = user ? getExchangePartnerLabel(ex, user.userId) : "Community member";
                  const userConfirmed = user ? hasUserConfirmed(ex, user.userId) : false;
                  const partnerConfirmed = user ? isPartnerConfirmed(ex, user.userId) : false;
                  const isSkillOfferRequest = ex.post_type === "offers" && user?.userId === ex.poster_id;

                  return (
                    <div key={ex.id} className="p-4 space-y-3">
                      <div>
                        <p className="text-sm font-semibold dash-heading">{ex.title}</p>
                        <p className="text-xs dash-subtext mt-1">
                          {isSkillOfferRequest ? "Requested by" : "With"} {partner.name} · {ex.hours}h
                          {ex.exchange_format ? ` · ${formatExchangeFormat(ex.exchange_format)}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className={`dash-badge px-2 py-0.5 rounded-full ${userConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                          You {userConfirmed ? "confirmed" : "pending"}
                        </span>
                        <span className={`dash-badge px-2 py-0.5 rounded-full ${partnerConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                          {partner.name.split(" ")[0]} {partnerConfirmed ? "confirmed" : "pending"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openMemberProfile(ex)}
                          className="dash-btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                        >
                          <UserCircle size={13} />
                          View {partnerLabel.toLowerCase()}
                        </button>
                        {!userConfirmed && (
                          <button
                            type="button"
                            onClick={() => onConfirm(ex.id)}
                            disabled={actionId === ex.id || isPreview}
                            className="dash-btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold disabled:opacity-60"
                          >
                            <CheckCircle2 size={13} />
                            Confirm
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onCancel(ex.id)}
                          disabled={actionId === ex.id || isPreview}
                          className="dash-btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-60"
                        >
                          <XCircle size={13} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {section === "history" && (
          <div>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b dash-divider">
              <p className="text-xs dash-subtext">{filtered.length} completed</p>
              <div className="dash-pill-group flex rounded-full p-0.5">
                {(["all", "given", "received"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onTabChange(t)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      tab === t ? "dash-pill-active" : "dash-pill-inactive"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-10 text-sm text-center dash-subtext">
                No completed jobs yet. Browse the Job Board to get started.
              </p>
            ) : (
              <div className="divide-y dash-divider">
                {filtered.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.type === "given"
                          ? "dash-badge-earn"
                          : item.type === "received"
                            ? "dash-badge-spend"
                            : "dash-badge-neutral"
                      }`}
                    >
                      {item.type === "given" ? (
                        <ArrowUpRight size={14} className="dash-accent-grass" />
                      ) : item.type === "received" ? (
                        <ArrowDownLeft size={14} className="dash-accent" />
                      ) : (
                        <CheckCircle2 size={14} className="dash-subtext" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dash-heading truncate">{item.task}</p>
                      <p className="text-xs dash-subtext truncate">
                        {item.name} · {item.date}
                      </p>
                    </div>
                    <span
                      className="text-sm font-medium flex-shrink-0"
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        color:
                          item.type === "given"
                            ? dashColors.earn
                            : item.type === "received"
                              ? dashColors.spend
                              : dashColors.neutral,
                      }}
                    >
                      {item.type === "given" ? "+" : item.type === "received" ? "-" : ""}
                      {item.type === "free" ? "Free" : `${item.hours}h`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "listings" && (
          <div>
            <p className="px-4 pt-4 text-xs dash-subtext">
              Manage your active and closed job board listings.
            </p>
            <MyListingsPanel
              variant="profile"
              scrollClassName="max-h-none"
              onStatsChange={onListingStatsChange}
            />
          </div>
        )}
      </section>

      <MemberProfileModal
        userId={viewingMemberId}
        roleLabel={viewingMemberLabel}
        onClose={() => {
          setViewingMemberId(null);
          setViewingMemberLabel(undefined);
        }}
      />
    </div>
  );
}
