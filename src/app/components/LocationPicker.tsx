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
    setSearchOpen(false);
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

  const canSave = Boolean(pickedSuggestion || detectedLocation);
  const hasSelection = canSave;

  const labelClass = compact ? "auth-label" : "dash-label";
  const inputClass = compact
    ? "auth-input signup-input-with-icon w-full"
    : "dash-input w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 pl-10";
  const saveButtonClass = compact
    ? "auth-btn-primary px-5 py-2 rounded-full text-xs font-semibold disabled:opacity-50"
    : "dash-btn-primary px-5 py-2 rounded-full text-xs font-semibold disabled:opacity-50";
  const detectButtonClass = compact
    ? "auth-btn-secondary flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium disabled:opacity-50"
    : "dash-btn-outline flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium disabled:opacity-50";

  const searchField = (
    <div className="space-y-1.5 relative overflow-visible" ref={searchRef}>
      <label className={labelClass}>City & region</label>
      <div className="relative">
        <Search
          size={14}
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            compact ? "text-[var(--auth-text-muted)]" : "dash-subtext"
          }`}
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
          className={[
            inputClass,
            (searching || (saved && showSuccessMessage)) && "signup-input-with-trailing-icon",
            hasSelection && !saved && "ring-2 ring-[var(--auth-aqua)]/35",
          ]
            .filter(Boolean)
            .join(" ")}
          autoComplete="off"
        />
        {searching && (
          <Loader2
            size={14}
            className={`absolute right-3 top-1/2 -translate-y-1/2 animate-spin ${
              compact ? "text-[var(--auth-text-muted)]" : "dash-subtext"
            }`}
          />
        )}
        {saved && showSuccessMessage && (
          <CheckCircle2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--auth-aqua)]"
          />
        )}
      </div>

      {searchOpen && searchQuery.trim().length >= 2 && (
        <ul
          className={
            compact
              ? "absolute z-30 mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-white/80 bg-white/95 shadow-lg backdrop-blur-md"
              : "dash-modal absolute z-30 mt-1 w-full max-h-48 overflow-y-auto rounded-xl"
          }
        >
          {searching && (
            <li className="px-4 py-3 text-xs text-[var(--auth-text-muted)]">Searching…</li>
          )}
          {!searching && suggestions.length === 0 && (
            <li className="px-4 py-3 text-xs text-[var(--auth-text-muted)]">
              No matches — try another spelling
            </li>
          )}
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.city}-${suggestion.state}-${suggestion.country}-${suggestion.label}`}>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm text-[#062a38] hover:bg-[rgba(45,212,200,0.12)] transition-colors"
                onClick={() => applySuggestion(suggestion)}
              >
                {suggestion.label}
                {suggestion.stateName && suggestion.country !== "US" && (
                  <span className="block text-[10px] text-[var(--auth-text-muted)]">
                    {suggestion.stateName}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !canSave}
        className={saveButtonClass}
      >
        {saving ? "Saving..." : initialLocation ? "Update location" : "Save location"}
      </button>
      <button
        type="button"
        onClick={handleDetect}
        disabled={detecting}
        className={detectButtonClass}
      >
        {detecting ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Navigation size={12} />
        )}
        {detecting ? "Detecting..." : "Detect my area"}
      </button>
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-4 overflow-visible">
        {searchField}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {saved && showSuccessMessage && (
          <p className="text-xs font-medium text-[var(--auth-aqua)] flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            Location saved
          </p>
        )}
        {actions}
      </div>
    );
  }

  return (
    <div className="dash-card rounded-2xl p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="dash-icon-box w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="dash-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold dash-heading">Where are you based?</h3>
          <p className="text-xs dash-subtext mt-0.5">
            Search for your city anywhere in the world — pick a result from the dropdown.
          </p>
        </div>
      </div>

      <div className="mb-3 overflow-visible">{searchField}</div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {saved && showSuccessMessage && (
        <p className="text-xs dash-accent-grass mb-3 flex items-center gap-1.5">
          <CheckCircle2 size={13} />
          Location saved
        </p>
      )}

      <div className="mt-4">{actions}</div>
    </div>
  );
}
