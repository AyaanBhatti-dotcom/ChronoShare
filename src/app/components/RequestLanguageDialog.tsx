import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Loader2, Send } from "lucide-react";
import { submitLanguageRequest } from "../../lib/language-requests";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface RequestLanguageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestLanguageDialog({ open, onOpenChange }: RequestLanguageDialogProps) {
  const { t } = useTranslation();
  const [languageName, setLanguageName] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setLanguageName("");
    setReason("");
    setError("");
    setSuccess(false);
    setLoading(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await submitLanguageRequest(languageName, reason);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("languageRequest.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="dash-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 dash-heading">
            <Globe size={18} className="dash-accent" />
            {t("languageRequest.title")}
          </DialogTitle>
          <DialogDescription className="dash-subtext">
            {t("languageRequest.description")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-2">
            <p className="text-sm dash-heading">{t("languageRequest.successTitle")}</p>
            <p className="text-xs dash-subtext">{t("languageRequest.successBody")}</p>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="dash-btn-primary w-full py-2.5 rounded-full text-sm font-semibold"
            >
              {t("common.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="language-name" className="dash-label">
                {t("languageRequest.languageLabel")}
              </label>
              <input
                id="language-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                placeholder={t("languageRequest.languagePlaceholder")}
                className="dash-input w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="language-reason" className="dash-label">
                {t("languageRequest.reasonLabel")}
              </label>
              <textarea
                id="language-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("languageRequest.reasonPlaceholder")}
                className="dash-input w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || languageName.trim().length < 2}
              className="dash-btn-primary w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("languageRequest.sending")}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {t("languageRequest.submit")}
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
