import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Loader2, CheckCircle2, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  saveUserLocation,
  searchLocationSuggestions,
  suggestLocationFromIp,
  suggestionToUserLocation,
  formatLocationLabel,
  type LocationSuggestion,
  type UserLocation,
} from "../../lib/location";

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
  const [searchQuery, setSearchQuery] = useState(
    initialLocation ? formatLocationLabel(initialLocation) : "",
  );
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pickedSuggestion, setPickedSuggestion] = useState<LocationSuggestion | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<UserLocation | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialLocation) {
      setSearchQuery(formatLocationLabel(initialLocation));
    }
  }, [initialLocation]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchLocationSuggestions(searchQuery);
        if (!cancelled) setSuggestions(results);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, searchOpen]);

  const resetSelection = () => {
    setPickedSuggestion(null);
    setDetectedLocation(null);
    setSaved(false);
  };

  const applySuggestion = (suggestion: LocationSuggestion) => {
    setSearchQuery(suggestion.label);
    setPickedSuggestion(suggestion);
    setDetectedLocation(null);
    setSearchOpen(false);
    setSaved(false);
    setError(null);
  };

  const handleDetect = async () => {
    setDetecting(true);
    setError(null);
    try {
      const suggestion = await suggestLocationFromIp();
      if (!suggestion) {
        setError("Could not detect your area. Search for your city below.");
        return;
      }
      setDetectedLocation(suggestion);
      setPickedSuggestion(null);
      setSearchQuery(formatLocationLabel(suggestion));
      setSaved(false);
    } catch {
      setError("Detection failed. Search for your city below.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    let location: UserLocation | null = null;

    if (pickedSuggestion) {
      location = suggestionToUserLocation(pickedSuggestion);
    } else if (detectedLocation) {
      location = detectedLocation;
    } else {
      setError("Pick your city from the search results, or use detect my area.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await saveUserLocation(user.userId, location);
      setSaved(true);
      onSaved(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save location.");
    } finally {
      setSaving(false);
    }
  };

  const selectedLabel = pickedSuggestion?.label ?? (detectedLocation ? formatLocationLabel(detectedLocation) : null);
  const canSave = Boolean(pickedSuggestion || detectedLocation);

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
              Search for your city anywhere in the world — pick a result from the dropdown.
            </p>
          </div>
        </div>
      )}

      <div className={`${compact ? "" : "mb-3"}`}>
        <div className="space-y-1.5 relative" ref={searchRef}>
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
            City & region
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
            />
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetSelection();
                setSearchOpen(true);
                setError(null);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="e.g. Tokyo, JP or Austin, TX"
              className={`${inputClass} pl-9`}
              style={inputStyle}
              autoComplete="off"
            />
            {searching && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6B7280]"
              />
            )}
          </div>

          {searchOpen && searchQuery.trim().length >= 2 && (
            <ul
              className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border shadow-lg"
              style={{ background: "#0B0F19", borderColor: "#374151" }}
            >
              {searching && (
                <li className="px-4 py-3 text-xs text-[#6B7280]">Searching…</li>
              )}
              {!searching && suggestions.length === 0 && (
                <li className="px-4 py-3 text-xs text-[#6B7280]">No matches — try another spelling</li>
              )}
              {suggestions.map((suggestion) => (
                <li key={`${suggestion.city}-${suggestion.state}-${suggestion.country}`}>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-emerald-500/10 transition-colors"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    {suggestion.label}
                    {suggestion.stateName && suggestion.country !== "US" && (
                      <span className="block text-[10px] text-[#6B7280]">{suggestion.stateName}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedLabel && (
        <p className="text-xs text-[#9CA3AF] mb-3">
          Selected: <span className="text-emerald-400">{selectedLabel}</span>
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
          disabled={saving || !canSave}
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
