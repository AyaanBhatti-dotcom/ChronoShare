import { Check } from "lucide-react";
import {
  MEETING_PREFERENCE_OPTIONS,
  type MeetingPreference,
} from "../../../lib/meeting-preference";

interface MeetingPreferenceSelectorProps {
  value: MeetingPreference | null;
  onChange: (value: MeetingPreference) => void;
  label?: string;
  hint?: string;
  variant?: "default" | "studio";
}

export function MeetingPreferenceSelector({
  value,
  onChange,
  label = "Where should this happen?",
  hint = "Public meetups are safer than inviting strangers to a private home.",
  variant = "default",
}: MeetingPreferenceSelectorProps) {
  const isStudio = variant === "studio";

  return (
    <div className="space-y-2">
      <div>
        <label className={isStudio ? "post-studio-section-label" : "dash-label"}>{label}</label>
        {hint && <p className="text-xs dash-subtext mt-1">{hint}</p>}
      </div>
      <div className={isStudio ? "post-studio-format-grid" : "grid grid-cols-1 gap-2"}>
        {MEETING_PREFERENCE_OPTIONS.map((option) => {
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
                <span className="post-studio-format-label flex items-center gap-1.5">
                  {option.label}
                  {option.badge && (
                    <span className="text-[9px] uppercase tracking-wide dash-badge-earn px-1.5 py-0.5 rounded-full">
                      {option.badge}
                    </span>
                  )}
                </span>
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
              <div className="flex items-center gap-2 w-full">
                <Icon
                  size={18}
                  className={active ? "text-[var(--dash-aqua)]" : "text-[var(--dash-text-muted)]"}
                />
                <span className={`font-semibold ${active ? "text-[var(--dash-text)]" : "dash-heading"}`}>
                  {option.label}
                </span>
                {option.badge && (
                  <span className="ml-auto text-[9px] uppercase tracking-wide dash-badge-earn px-1.5 py-0.5 rounded-full">
                    {option.badge}
                  </span>
                )}
              </div>
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
