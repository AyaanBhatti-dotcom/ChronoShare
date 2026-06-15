import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check, Plus } from "lucide-react";
import { LANGUAGES } from "../../i18n/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { RequestLanguageDialog } from "./RequestLanguageDialog";

interface LanguageSwitcherProps {
  variant?: "landing" | "dashboard" | "compact";
  className?: string;
  /** Hide the language label on small screens (globe icon only). */
  iconOnly?: boolean;
}

export function LanguageSwitcher({
  variant = "dashboard",
  className = "",
  iconOnly = false,
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [requestOpen, setRequestOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === i18n.language.split("-")[0]) ?? LANGUAGES[0];

  const triggerClass =
    variant === "landing"
      ? "landing-lang-trigger"
      : variant === "compact"
        ? "dash-lang-trigger-compact"
        : "dash-lang-trigger";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`${triggerClass} ${className}`.trim()}
          aria-label={t("common.selectLanguage")}
        >
          <Globe size={variant === "compact" ? 14 : 16} />
          <span className={`truncate ${iconOnly ? "max-sm:sr-only" : ""}`.trim()}>
            {current.nativeName}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="aero-lang-menu dash-lang-menu">
          {LANGUAGES.map((lang) => {
            const active = lang.code === current.code;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`aero-lang-item ${active ? "aero-lang-item-active" : ""}`}
              >
                <span className="flex-1">
                  <span className="aero-lang-native">{lang.nativeName}</span>
                  <span className="aero-lang-english">{lang.name}</span>
                </span>
                {active && <Check size={14} className="aero-lang-check" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setRequestOpen(true)}
            className="aero-lang-item aero-lang-request"
          >
            <Plus size={14} className="aero-lang-check flex-shrink-0" />
            <span className="text-sm font-semibold">{t("languageRequest.requestButton")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RequestLanguageDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  );
}
