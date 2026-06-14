import { useState } from "react";
import { Star, X } from "lucide-react";
import { submitExchangeReview } from "../../../lib/trust-safety";

interface ReviewToggleProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

function ReviewToggle({ label, value, onChange }: ReviewToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm dash-heading">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            value === true ? "dash-badge-earn" : "dash-badge-neutral"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            value === false ? "dash-badge-pending" : "dash-badge-neutral"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

export interface ExchangeReviewDialogProps {
  exchangeId: string;
  partnerName: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function ExchangeReviewDialog({
  exchangeId,
  partnerName,
  onClose,
  onSubmitted,
}: ExchangeReviewDialogProps) {
  const [showedUp, setShowedUp] = useState<boolean | null>(null);
  const [workCompleted, setWorkCompleted] = useState<boolean | null>(null);
  const [wouldExchangeAgain, setWouldExchangeAgain] = useState<boolean | null>(null);
  const [feltSafe, setFeltSafe] = useState<boolean | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      showedUp == null &&
      workCompleted == null &&
      wouldExchangeAgain == null &&
      feltSafe == null &&
      !details.trim()
    ) {
      setError("Answer at least one question.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitExchangeReview(exchangeId, {
        showedUp,
        workCompleted,
        wouldExchangeAgain,
        feltSafe,
        details: details.trim() || null,
      });
      setSuccess(true);
      onSubmitted?.();
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 dash-modal-overlay" onClick={onClose} />
      <div className="dash-modal relative w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 dash-subtext hover:dash-heading transition-colors"
          aria-label="Close review dialog"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full dash-badge-earn flex items-center justify-center">
              <Star size={20} className="dash-accent" />
            </div>
            <h3 className="text-lg font-semibold dash-heading">Thanks for the feedback</h3>
            <p className="text-sm dash-subtext">Your review helps others trade safely.</p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-semibold dash-heading">How did it go?</h3>
              <p className="text-sm dash-subtext mt-1">
                Quick feedback about your exchange with {partnerName}.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="rounded-xl border dash-divider px-4 divide-y dash-divider">
                <ReviewToggle label="Did they show up?" value={showedUp} onChange={setShowedUp} />
                <ReviewToggle label="Was the work completed?" value={workCompleted} onChange={setWorkCompleted} />
                <ReviewToggle
                  label="Would you exchange again?"
                  value={wouldExchangeAgain}
                  onChange={setWouldExchangeAgain}
                />
                <ReviewToggle label="Did you feel safe?" value={feltSafe} onChange={setFeltSafe} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold dash-heading" htmlFor="review-details">
                  Anything else? (optional)
                </label>
                <textarea
                  id="review-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  placeholder="Optional notes"
                  className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="dash-btn-primary px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
                >
                  {submitting ? "Saving…" : "Submit review"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="dash-btn-outline px-5 py-2.5 rounded-full text-sm font-medium"
                >
                  Skip for now
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
