import { useTranslation } from "react-i18next";
import { Check, Globe, Plus } from "lucide-react";
import { LANGUAGES } from "../../i18n/languages";
import { RequestLanguageDialog } from "./RequestLanguageDialog";
import { useState } from "react";

interface LanguagePickerProps {
  variant?: "onboarding" | "settings";
  onSelected?: (code: string) => void;
}

export function LanguagePicker({ variant = "onboarding", onSelected }: LanguagePickerProps) {
  const { i18n, t } = useTranslation();
  const [requestOpen, setRequestOpen] = useState(false);
  const currentCode = i18n.language.split("-")[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    onSelected?.(code);
  };

  const itemClass =
    variant === "onboarding"
      ? "signup-lang-option"
      : "dash-lang-option";

  const activeClass =
    variant === "onboarding"
      ? "signup-lang-option-active"
      : "dash-lang-option-active";

  return (
    <>
      <div className={`signup-lang-grid ${variant === "settings" ? "signup-lang-grid-compact" : ""}`}>
        {LANGUAGES.map((lang) => {
          const active = lang.code === currentCode;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`${itemClass} ${active ? activeClass : ""}`}
              aria-pressed={active}
            >
              <span className="signup-lang-native">{lang.nativeName}</span>
              <span className="signup-lang-english">{lang.name}</span>
              {active && <Check size={14} className="signup-lang-check" />}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setRequestOpen(true)}
        className="signup-lang-request mt-4 w-full flex items-center justify-center gap-2 text-sm"
      >
        <Plus size={14} />
        {t("languageRequest.requestButton")}
      </button>

      <RequestLanguageDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  );
}

/** Compact globe label for headers during onboarding */
export function OnboardingLanguageBadge() {
  const { i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language.split("-")[0]) ?? LANGUAGES[0];

  return (
    <span className="signup-lang-badge">
      <Globe size={12} />
      {current.nativeName}
    </span>
  );
}
