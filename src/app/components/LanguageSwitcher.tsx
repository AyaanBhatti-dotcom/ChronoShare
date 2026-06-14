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
}

export function LanguageSwitcher({ variant = "dashboard", className = "" }: LanguageSwitcherProps) {
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
          <span className="truncate">{current.nativeName}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="dash-lang-menu min-w-[10rem]">
          {LANGUAGES.map((lang) => {
            const active = lang.code === current.code;
            return (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`dash-lang-item ${active ? "dash-lang-item-active" : ""}`}
              >
                <span className="flex-1">
                  <span className="block text-sm font-medium">{lang.nativeName}</span>
                  <span className="block text-[10px] opacity-60">{lang.name}</span>
                </span>
                {active && <Check size={14} className="dash-accent flex-shrink-0" />}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setRequestOpen(true)}
            className="dash-lang-item dash-lang-request"
          >
            <Plus size={14} className="dash-accent flex-shrink-0" />
            <span className="text-sm font-medium">{t("languageRequest.requestButton")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RequestLanguageDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  );
}
