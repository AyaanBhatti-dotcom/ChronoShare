import { Globe, MapPin } from "lucide-react";
import type { ListingScope } from "../../lib/listing-scope";

interface ListingScopeToggleProps {
  scope: ListingScope;
  onChange: (scope: ListingScope) => void;
}

export function ListingScopeToggle({ scope, onChange }: ListingScopeToggleProps) {
  return (
    <div
      className="flex rounded-full p-1 w-fit"
      style={{ background: "#111827", border: "1px solid #1F2937" }}
    >
      {(["nearby", "worldwide"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background: scope === option ? "#10B981" : "transparent",
            color: scope === option ? "#000" : "#9CA3AF",
          }}
        >
          {option === "nearby" ? <MapPin size={12} /> : <Globe size={12} />}
          {option === "nearby" ? "Near me" : "Anywhere"}
        </button>
      ))}
    </div>
  );
}
