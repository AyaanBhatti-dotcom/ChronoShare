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
}

export function ExchangeFormatSelector({
  value,
  onChange,
  mode = "post",
  label = "How will this exchange happen?",
  hint,
}: ExchangeFormatSelectorProps) {
  const options = mode === "join" ? JOIN_FORMAT_OPTIONS : EXCHANGE_FORMAT_OPTIONS;

  return (
    <div className="space-y-2">
      <div>
        <label className="dash-label">{label}</label>
        {hint && <p className="text-xs dash-subtext mt-1">{hint}</p>}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = value === option.id;
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${
                active ? "dash-category-active" : "dash-category-inactive"
              }`}
            >
              <Icon size={18} className={active ? "dash-accent" : "dash-subtext"} />
              <span className="dash-heading">{option.label}</span>
              <span className="text-[11px] font-normal dash-subtext leading-snug">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
