import { Shield } from "lucide-react";

interface SafetyTipBannerProps {
  variant?: "default" | "compact";
  message?: string;
}

export function SafetyTipBanner({
  variant = "default",
  message = "Meet in a public place — library, café, or community center. Never share your home address in a listing.",
}: SafetyTipBannerProps) {
  if (variant === "compact") {
    return (
      <div className="dash-modal-callout">
        <Shield size={14} className="dash-accent flex-shrink-0 mt-0.5" />
        <p>{message}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border px-4 py-3 flex items-start gap-3"
      style={{
        borderColor: "rgba(94, 255, 240, 0.2)",
        background: "rgba(94, 255, 240, 0.06)",
      }}
    >
      <Shield size={16} className="dash-accent flex-shrink-0 mt-0.5" />
      <p className="text-xs dash-subtext leading-relaxed">{message}</p>
    </div>
  );
}
