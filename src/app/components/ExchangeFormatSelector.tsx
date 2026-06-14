import { Check } from "lucide-react";
import type { ExchangeFormatPreference, ExchangeFormatResolved } from "../../lib/exchange-format";
import {
  EXCHANGE_FORMAT_OPTIONS,
  JOIN_FORMAT_OPTIONS,
} from "../../lib/exchange-format";

interface ExchangeFormatSelectorProps {
  value: ExchangeFormatPreference | ExchangeFormatResolved | null;
  onChange: (value: ExchangeFormatPreference | ExchangeFormatResolved) => void;
  mode?: "post" | "join";
  label?: string;
  hint?: string;
  variant?: "default" | "studio";
  hideLabel?: boolean;
}

export function ExchangeFormatSelector({
  value,
  onChange,
  mode = "post",
  label = "How will this exchange happen?",
  hint,
  variant = "default",
  hideLabel = false,
}: ExchangeFormatSelectorProps) {
  const options = mode === "join" ? JOIN_FORMAT_OPTIONS : EXCHANGE_FORMAT_OPTIONS;
  const isStudio = variant === "studio";

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <div>
          <label className="dash-label">{label}</label>
          {hint && <p className="text-xs dash-subtext mt-1">{hint}</p>}
        </div>
      )}
      <div className={isStudio ? "post-studio-format-grid" : "grid grid-cols-1 gap-2 sm:grid-cols-3"}>
        {options.map((option) => {
          const active = value === option.id;
          const Icon = option.icon;

          if (isStudio) {
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(option.id)}
                className={`post-studio-format-option ${active ? "post-studio-format-option-active" : ""}`}
              >
                {active && (
                  <span className="post-studio-pick-badge" aria-hidden>
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
                <Icon
                  size={18}
                  className={active ? "text-[var(--dash-aqua)]" : "text-[var(--dash-text-muted)]"}
                />
                <span className="post-studio-format-label">{option.label}</span>
                <span className="post-studio-format-desc">{option.description}</span>
              </button>
            );
          }

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${
                active ? "dash-category-active" : "dash-category-inactive"
              }`}
            >
              <Icon
                size={18}
                className={active ? "text-[var(--dash-aqua)]" : "text-[var(--dash-text-muted)]"}
              />
              <span className={`font-semibold ${active ? "text-[var(--dash-text)]" : "dash-heading"}`}>
                {option.label}
              </span>
              <span className={`text-[11px] font-normal leading-snug ${active ? "text-[var(--dash-text-muted)]" : "dash-subtext"}`}>
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
