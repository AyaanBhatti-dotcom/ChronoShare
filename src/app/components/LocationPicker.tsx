import { useEffect, useState } from "react";
import { MapPin, Navigation, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  geocodeCityState,
  saveUserLocation,
  suggestLocationFromIp,
  formatLocationLabel,
  type UserLocation,
} from "../../lib/location";
import { US_STATES } from "../../lib/us-states";

interface LocationPickerProps {
  initialLocation?: UserLocation | null;
  onSaved: (location: UserLocation) => void;
  compact?: boolean;
  showSuccessMessage?: boolean;
}

export function LocationPicker({
  initialLocation,
  onSaved,
  compact = false,
  showSuccessMessage = false,
}: LocationPickerProps) {
  const { user } = useAuth();
  const [city, setCity] = useState(initialLocation?.city ?? "");
  const [state, setState] = useState(initialLocation?.state ?? "");
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [suggestedLabel, setSuggestedLabel] = useState<string | null>(null);

  useEffect(() => {
    if (initialLocation) {
      setCity(initialLocation.city ?? "");
      setState(initialLocation.state ?? "");
    }
  }, [initialLocation]);

  const handleDetect = async () => {
    setDetecting(true);
    setError(null);
    setSuggestedLabel(null);
    try {
      const suggestion = await suggestLocationFromIp();
      if (!suggestion) {
        setError("Could not detect your area. Enter city and state manually.");
        return;
      }
      setCity(suggestion.city ?? "");
      setState(suggestion.state ?? "");
      setSuggestedLabel(formatLocationLabel(suggestion));
    } catch {
      setError("Detection failed. Enter city and state manually.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!city.trim() || !state) {
      setError("City and state are required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const geocoded = await geocodeCityState(city, state);
      if (!geocoded) {
        setError("Could not find that city. Check spelling and try again.");
        return;
      }

      await saveUserLocation(user.userId, geocoded);
      setSaved(true);
      onSaved(geocoded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save location.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500";
  const inputStyle = { background: "#0B0F19", border: "1px solid #1F2937" } as const;

  return (
    <div
      className={`rounded-2xl border ${compact ? "p-5" : "p-6"}`}
      style={{ background: "#111827", borderColor: "#1F2937" }}
    >
      {!compact && (
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <MapPin size={18} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Where are you based?</h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              We use this to show nearby listings on your map. You can change it anytime in Settings.
            </p>
          </div>
        </div>
      )}

      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2 mb-3"}`}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">City</label>
          <input
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setSaved(false);
              setSuggestedLabel(null);
            }}
            placeholder="e.g. Austin"
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">State</label>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setSaved(false);
              setSuggestedLabel(null);
            }}
            className={`${inputClass} cursor-pointer`}
            style={inputStyle}
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {suggestedLabel && (
        <p className="text-xs text-cyan-400/90 mb-3">
          Suggested from your connection: {suggestedLabel}. Review and save if it looks right.
        </p>
      )}

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {saved && showSuccessMessage && (
        <p className="text-xs text-emerald-400 mb-3 flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          Location saved
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !city.trim() || !state}
          className="px-5 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#10B981", color: "#000" }}
        >
          {saving ? "Saving..." : initialLocation ? "Update location" : "Save location"}
        </button>
        <button
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all hover:bg-white/[0.04] disabled:opacity-50"
          style={{ borderColor: "#374151", color: "#9CA3AF" }}
        >
          {detecting ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Navigation size={12} />
          )}
          {detecting ? "Detecting..." : "Detect my area"}
        </button>
      </div>
    </div>
  );
}
