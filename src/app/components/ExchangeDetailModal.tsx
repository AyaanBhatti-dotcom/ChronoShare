import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  X, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight, User, Flag, Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getInitials } from "../context/AuthContext";
import {
  getExchangePartner,
  getExchangePartnerLabel,
  getExchangeHourType,
  getExchangePartnerId,
  hasUserConfirmed,
  isPartnerConfirmed,
  formatHourImpactLabel,
  getHourImpact,
} from "../../lib/exchanges";
import { formatExchangeFormat } from "../../lib/exchange-format";
import { formatMemberLabel } from "../../lib/profile";
import { dashColors } from "./onboarding/aeroTheme";
import type { ExchangeWithProfiles } from "../../types/database";
import { SafetyTipBanner } from "./safety/SafetyTipBanner";
import { ReportMemberDialog } from "./safety/ReportMemberDialog";
import { ExchangeReviewDialog } from "./safety/ExchangeReviewDialog";
import { hasExchangeReview } from "../../lib/trust-safety";

function categoryIcon(cat: string) {
  const map: Record<string, React.ReactNode> = {
    Tech: <Monitor size={14} />,
    Labor: <Wrench size={14} />,
    Education: <BookOpen size={14} />,
    Music: <Music size={14} />,
    Cooking: <ChefHat size={14} />,
    Design: <Palette size={14} />,
  };
  return map[cat] || <Monitor size={14} />;
}

function formatDetailDate(iso: string | null) {
  if (!iso) return "Date unknown";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface ExchangeDetailModalProps {
  exchange: ExchangeWithProfiles | null;
  userId: string | undefined;
  description?: string | null;
  onClose: () => void;
  onViewPartner?: (exchange: ExchangeWithProfiles) => void;
  onConfirm?: (exchangeId: string) => void;
  onCancel?: (exchangeId: string) => void;
  actionId?: string | null;
  isPreview?: boolean;
}

export function ExchangeDetailModal({
  exchange,
  userId,
  description,
  onClose,
  onViewPartner,
  onConfirm,
  onCancel,
  actionId,
  isPreview,
}: ExchangeDetailModalProps) {
  const [showReport, setShowReport] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    setShowReport(false);
    setShowReview(false);
    setReviewSubmitted(false);
  }, [exchange?.id]);

  useEffect(() => {
    if (!exchange || !userId || exchange.status !== "completed") return;
    hasExchangeReview(exchange.id)
      .then((exists) => setReviewSubmitted(exists))
      .catch(() => setReviewSubmitted(false));
  }, [exchange, userId]);

  if (!exchange || !userId) return null;

  const partner = getExchangePartner(exchange, userId);
  const partnerId = getExchangePartnerId(exchange, userId);
  const partnerProfile = exchange.poster_id === userId ? exchange.acceptor : exchange.poster;
  const partnerLabel = formatMemberLabel(partnerProfile);
  const roleLabel = getExchangePartnerLabel(exchange, userId);
  const hourType = getExchangeHourType(exchange, userId);
  const isPending = exchange.status === "pending";
  const userConfirmed = hasUserConfirmed(exchange, userId);
  const partnerConfirmed = isPartnerConfirmed(exchange, userId);
  const isAcceptor = exchange.acceptor_id === userId;
  const impact = getHourImpact(exchange.post_type, isAcceptor, exchange.hours);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 dash-modal-overlay" onClick={onClose} />
      <div className="dash-modal relative w-full max-w-md rounded-2xl p-6 space-y-5 dash-modal-mobile max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 dash-subtext hover:dash-heading transition-colors"
          aria-label="Close details"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 flex-wrap pr-8">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              isPending ? "dash-badge-pending" : "dash-badge-done"
            }`}
          >
            {isPending ? "Awaiting confirmation" : "Completed"}
          </span>
          <span className="dash-badge-neutral text-[10px] px-2 py-0.5 rounded-full font-medium capitalize">
            {exchange.post_type === "needs" ? "Need help" : "Offering"}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-semibold dash-heading leading-snug">{exchange.title}</h3>
          <p className="text-xs dash-subtext mt-1">{roleLabel}</p>
        </div>

        {description && (
          <p className="text-sm dash-subtext leading-relaxed">{description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs dash-subtext">
          <span className="inline-flex items-center gap-1 dash-badge-neutral px-2 py-0.5 rounded-full">
            {categoryIcon(exchange.category)}
            {exchange.category}
          </span>
          <span
            className="inline-flex items-center gap-1 font-medium dash-accent"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <Clock size={11} />
            {exchange.hours}h
          </span>
          {exchange.exchange_format && (
            <span>{formatExchangeFormat(exchange.exchange_format)}</span>
          )}
        </div>

        {exchange.exchange_format === "in_person" && (
          <SafetyTipBanner variant="compact" />
        )}

        <div className="rounded-xl border dash-divider p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="dash-avatar w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {getInitials(partner.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium dash-heading truncate">{partner.name}</p>
              <p className="text-xs dash-subtext">{partnerLabel}</p>
            </div>
          </div>
          {onViewPartner && (
            <button
              type="button"
              onClick={() => onViewPartner(exchange)}
              className="dash-btn-outline w-full py-2 rounded-full text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <User size={13} />
              View {partnerLabel}&apos;s profile
            </button>
          )}
        </div>

        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background:
              hourType === "earned"
                ? "rgba(91, 199, 122, 0.12)"
                : hourType === "spent"
                  ? "rgba(94, 255, 240, 0.08)"
                  : "rgba(255, 255, 255, 0.06)",
          }}
        >
          {hourType === "earned" ? (
            <ArrowUpRight size={20} className="dash-accent-grass" />
          ) : hourType === "spent" ? (
            <ArrowDownRight size={20} className="dash-accent" />
          ) : (
            <CheckCircle2 size={20} className="dash-subtext" />
          )}
          <div>
            <p
              className="text-sm font-semibold"
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
              {hourType === "free" ? "Free exchange" : `${hourType === "earned" ? "+" : "-"}${exchange.hours}h`}
            </p>
            <p className="text-xs dash-subtext">
              {isPending
                ? impact.direction === "free"
                  ? "No hours move until both people confirm."
                  : `You'll ${impact.direction === "earn" ? "earn" : "spend"} ${impact.amount}h when confirmed.`
                : hourType === "earned"
                  ? "Hours were added to your balance."
                  : hourType === "spent"
                    ? "Hours were deducted from your balance."
                    : "No hours were transferred for this exchange."}
            </p>
          </div>
        </div>

        <div className="space-y-1 text-xs dash-subtext">
          <p>
            <span className="dash-heading font-medium">Accepted:</span>{" "}
            {formatDetailDate(exchange.created_at)}
          </p>
          {!isPending && (
            <p>
              <span className="dash-heading font-medium">Completed:</span>{" "}
              {formatDetailDate(exchange.completed_at ?? exchange.created_at)}
            </p>
          )}
          {!isPending && (
            <p className="text-[11px] opacity-80">
              Impact: {formatHourImpactLabel(impact)}
            </p>
          )}
        </div>

        {isPending && (
          <div className="space-y-2">
            <p className="text-xs font-semibold dash-heading">Confirmation status</p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className={`dash-badge px-2 py-0.5 rounded-full ${userConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                You {userConfirmed ? "confirmed" : "pending"}
              </span>
              <span className={`dash-badge px-2 py-0.5 rounded-full ${partnerConfirmed ? "dash-badge-earn" : "dash-badge-neutral"}`}>
                {partner.name.split(" ")[0]} {partnerConfirmed ? "confirmed" : "pending"}
              </span>
            </div>
            {(onConfirm || onCancel) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {!userConfirmed && onConfirm && (
                  <button
                    type="button"
                    onClick={() => onConfirm(exchange.id)}
                    disabled={actionId === exchange.id || isPreview}
                    className="dash-btn-primary flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold disabled:opacity-60"
                  >
                    <CheckCircle2 size={13} />
                    Confirm exchange
                  </button>
                )}
                {onCancel && (
                  <button
                    type="button"
                    onClick={() => onCancel(exchange.id)}
                    disabled={actionId === exchange.id || isPreview}
                    className="dash-btn-outline flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {!isPending && exchange.status === "completed" && !reviewSubmitted && !isPreview && (
          <button
            type="button"
            onClick={() => setShowReview(true)}
            className="dash-btn-outline w-full py-2 rounded-full text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <Star size={13} />
            Leave feedback
          </button>
        )}

        {!isPreview && (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="w-full py-2 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 dash-subtext hover:text-red-400 transition-colors"
          >
            <Flag size={13} />
            Report {partner.name.split(" ")[0]}
          </button>
        )}
      </div>

      {showReport && (
        <ReportMemberDialog
          reportedUserId={partnerId}
          reportedUserName={partner.name}
          exchangeId={exchange.id}
          onClose={() => setShowReport(false)}
        />
      )}

      {showReview && (
        <ExchangeReviewDialog
          exchangeId={exchange.id}
          partnerName={partner.name}
          onClose={() => setShowReview(false)}
          onSubmitted={() => setReviewSubmitted(true)}
        />
      )}
    </div>
  );
}
