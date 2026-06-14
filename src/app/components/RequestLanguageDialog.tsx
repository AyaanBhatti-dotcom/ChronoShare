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
      <DialogContent
        overlayClassName="aero-lang-dialog-overlay"
        className="aero-lang-dialog sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="aero-lang-dialog-title flex items-center gap-2 text-lg">
            <Globe size={18} className="aero-lang-check" />
            {t("languageRequest.title")}
          </DialogTitle>
          <DialogDescription className="aero-lang-dialog-desc">
            {t("languageRequest.description")}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-2">
            <p className="aero-lang-dialog-success">{t("languageRequest.successTitle")}</p>
            <p className="aero-lang-dialog-success-body">{t("languageRequest.successBody")}</p>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="aero-lang-dialog-btn py-2.5"
            >
              {t("common.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="aero-lang-dialog-error">{error}</div>}

            <div className="space-y-1.5">
              <label htmlFor="language-name" className="aero-lang-dialog-label">
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
                className="aero-lang-dialog-input"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="language-reason" className="aero-lang-dialog-label">
                {t("languageRequest.reasonLabel")}
              </label>
              <textarea
                id="language-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("languageRequest.reasonPlaceholder")}
                className="aero-lang-dialog-input resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || languageName.trim().length < 2}
              className="aero-lang-dialog-btn flex items-center justify-center gap-2 py-2.5"
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
