import { useState } from "react";
import { Flag, X } from "lucide-react";
import {
  REPORT_CATEGORIES,
  submitExchangeReport,
  type ReportCategory,
} from "../../../lib/trust-safety";

export interface ReportMemberDialogProps {
  reportedUserId: string;
  reportedUserName?: string;
  exchangeId?: string | null;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function ReportMemberDialog({
  reportedUserId,
  reportedUserName,
  exchangeId,
  onClose,
  onSubmitted,
}: ReportMemberDialogProps) {
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setError("Choose a reason for your report.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await submitExchangeReport({
        reportedUserId,
        category,
        exchangeId,
        details: details.trim() || null,
        alsoBlock,
      });
      setSuccess(true);
      onSubmitted?.();
      setTimeout(onClose, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report.");
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
          aria-label="Close report dialog"
        >
          <X size={18} />
        </button>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full dash-badge-earn flex items-center justify-center">
              <Flag size={20} className="dash-accent" />
            </div>
            <h3 className="text-lg font-semibold dash-heading">Report received</h3>
            <p className="text-sm dash-subtext">
              Our team will review this. Thank you for helping keep the community safe.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h3 className="text-lg font-semibold dash-heading flex items-center gap-2">
                <Flag size={18} className="dash-accent" />
                Report member
              </h3>
              <p className="text-sm dash-subtext mt-1">
                {reportedUserName
                  ? `Tell us what happened with ${reportedUserName}.`
                  : "Tell us what happened. Reports are reviewed by our team."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold dash-heading">Reason</p>
                <div className="space-y-2">
                  {REPORT_CATEGORIES.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        category === item.id ? "dash-category-active" : "dash-category-inactive"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-category"
                        value={item.id}
                        checked={category === item.id}
                        onChange={() => setCategory(item.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium dash-heading">{item.label}</span>
                        <span className="block text-xs dash-subtext">{item.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold dash-heading" htmlFor="report-details">
                  Details (optional)
                </label>
                <textarea
                  id="report-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="What happened? Include anything that helps us review."
                  className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                />
              </div>

              <label className="flex items-start gap-2 text-sm dash-subtext cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoBlock}
                  onChange={(e) => setAlsoBlock(e.target.checked)}
                  className="mt-1"
                />
                Also block this person — hide their listings and prevent future exchanges
              </label>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="dash-btn-primary px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Submit report"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="dash-btn-outline px-5 py-2.5 rounded-full text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
