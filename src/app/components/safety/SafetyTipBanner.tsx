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
      <p className="text-[11px] dash-subtext flex items-start gap-1.5 leading-relaxed">
        <Shield size={12} className="dash-accent flex-shrink-0 mt-0.5" />
        {message}
      </p>
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
