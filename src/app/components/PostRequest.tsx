import { useEffect, useState } from "react";
import {
  Minus, Plus, CheckCircle2, Sparkles, PenLine, Layers,
  HandHelping, Clock, FolderOpen, Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../../lib/posts";
import { getUserLocation } from "../../lib/location";
import { MyListingsPanel } from "./MyListingsPanel";
import { ExchangeFormatSelector } from "./ExchangeFormatSelector";
import { MeetingPreferenceSelector } from "./safety/MeetingPreferenceSelector";
import { SafetyTipBanner } from "./safety/SafetyTipBanner";
import type { ExchangeFormatPreference } from "../../lib/exchange-format";
import {
  defaultMeetingPreferenceForFormat,
  type MeetingPreference,
} from "../../lib/meeting-preference";

interface PostRequestProps {
  initialPostType?: "needs" | "offers";
  onNavigate?: (screen: string, options?: { postType?: "needs" | "offers"; boardMode?: "all" | "needs" | "offers" }) => void;
}

function SectionHead({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="post-studio-section-head">
      <div className="post-studio-section-icon">{icon}</div>
      <div>
        <p className="post-studio-section-label">{label}</p>
        {hint && <p className="post-studio-section-hint">{hint}</p>}
      </div>
    </div>
  );
}

export const PostRequest = ({ initialPostType = "needs", onNavigate }: PostRequestProps) => {
  const { user, isPreview } = useAuth();
  const [tab, setTab] = useState<"create" | "listings">("create");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [postType, setPostType] = useState<"needs" | "offers">(initialPostType);
  const [hours, setHours] = useState(1);
  const [exchangeFormat, setExchangeFormat] = useState<ExchangeFormatPreference>("remote");
  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference>("remote_only");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastPostedType, setLastPostedType] = useState<"needs" | "offers">("needs");

  useEffect(() => {
    setPostType(initialPostType);
  }, [initialPostType]);

  const handleExchangeFormatChange = (format: ExchangeFormatPreference) => {
    setExchangeFormat(format);
    setMeetingPreference(defaultMeetingPreferenceForFormat(format));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();

    if (!trimmedTitle || !trimmedCategory || !user) return;

    if (isPreview) {
      setError("Preview mode — posting is disabled.");
      return;
    }

    if (postType === "needs" && user.hoursAvailable < hours) {
      setError(
        `You need at least ${hours.toFixed(1)} hours in your balance to request help for this amount.`,
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const location = await getUserLocation(user.userId);
      await createPost({
        userId: user.userId,
        title: trimmedTitle,
        description: desc.trim() || null,
        category: trimmedCategory,
        postType,
        hoursCost: hours,
        exchangeFormat,
        meetingPreference,
        location,
      });
      setLastPostedType(postType);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle("");
        setDesc("");
        setCategory("");
        setPostType(initialPostType);
        setHours(1);
        setExchangeFormat("remote");
        setMeetingPreference("remote_only");
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="post-studio">
        <div className="post-studio-success">
          <div className="post-studio-success-icon">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold dash-heading">Live on the Job Board</h2>
          <p className="text-sm dash-subtext max-w-xs">
            Your listing is now visible to the community. Sit back while neighbors discover your offer.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate("board", { boardMode: lastPostedType })}
              className="dash-btn-primary mt-1 px-6 py-2.5 rounded-full text-sm font-semibold"
            >
              View on Job Board
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="post-studio">
      <header className="post-studio-hero">
        <div className="post-studio-hero-orb post-studio-hero-orb-a" aria-hidden />
        <div className="post-studio-hero-orb post-studio-hero-orb-b" aria-hidden />
        <div className="post-studio-hero-inner">
          <div className="post-studio-hero-badge">
            <Sparkles size={10} />
            Listing Studio
          </div>
          <h2 className="post-studio-hero-title">Create &amp; manage listings</h2>
          <p className="post-studio-hero-sub">
            Describe what you need or offer in your own words — set the hours and post.
          </p>
          {user && (
            <div className="post-studio-balance-chip">
              <Clock size={12} className="dash-accent" />
              <span>
                Balance: <strong>{user.hoursAvailable.toFixed(1)}h</strong> available
              </span>
            </div>
          )}
          {isPreview && (
            <p className="text-xs text-amber-600 mt-2 font-medium">Preview mode — form is read-only.</p>
          )}
        </div>
      </header>

      <div className="post-studio-tabs" role="tablist" aria-label="Listing views">
        {(["create", "listings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`post-studio-tab ${tab === t ? "post-studio-tab-active" : ""}`}
          >
            {t === "create" ? <PenLine size={15} /> : <FolderOpen size={15} />}
            {t === "create" ? "New Listing" : "My Listings"}
          </button>
        ))}
      </div>

      {tab === "create" ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <section className="post-studio-section">
            <SectionHead
              icon={<Layers size={15} />}
              label="Listing type"
              hint="Are you asking for help or offering a skill?"
            />
            <div className="post-studio-type-grid">
              {(["needs", "offers"] as const).map((type) => {
                const active = postType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPostType(type)}
                    className={`post-studio-type-card ${
                      active
                        ? `post-studio-type-card-active post-studio-type-card-active-${type}`
                        : ""
                    }`}
                  >
                    {active && (
                      <span className="post-studio-pick-badge" aria-hidden>
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                    <div className="post-studio-type-icon">
                      {type === "needs" ? <HandHelping size={17} /> : <Sparkles size={17} />}
                    </div>
                    <span className="post-studio-type-title">
                      {type === "needs" ? "Need Help" : "Offering Skill"}
                    </span>
                    <span className="post-studio-type-desc">
                      {type === "needs"
                        ? "Pay hours from your balance when someone helps."
                        : "Earn hours from the pool when someone accepts."}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="post-studio-section">
            <SectionHead
              icon={<PenLine size={15} />}
              label="Details"
              hint="Write it however you like — title, category, and description are all yours."
            />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="post-studio-section-label" htmlFor="listing-title">
                  Title
                </label>
                <input
                  id="listing-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you need or what can you offer?"
                  className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="post-studio-section-label" htmlFor="listing-category">
                  Category
                </label>
                <input
                  id="listing-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Gardening, Tech, Moving, Music…"
                  className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="post-studio-section-label" htmlFor="listing-desc">
                  Description
                </label>
                <textarea
                  id="listing-desc"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Optional — add any details that help people decide"
                  rows={3}
                  className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all duration-200"
                />
              </div>
            </div>
          </section>

          <section className="post-studio-section">
            <SectionHead
              icon={<HandHelping size={15} />}
              label="How it happens"
              hint="Remote is the safest default. For in-person, prefer public meetups."
            />
            <div className="space-y-4">
              <ExchangeFormatSelector
                value={exchangeFormat}
                onChange={handleExchangeFormatChange}
                variant="studio"
                label="Exchange format"
                hint="Choose how people will connect for this listing."
              />
              {exchangeFormat !== "remote" && (
                <MeetingPreferenceSelector
                  value={meetingPreference}
                  onChange={setMeetingPreference}
                  variant="studio"
                />
              )}
              {exchangeFormat !== "remote" && <SafetyTipBanner variant="compact" />}
            </div>
          </section>

          <section className="post-studio-section">
            <SectionHead
              icon={<Clock size={15} />}
              label="Hour value"
              hint="How many hours is this exchange worth?"
            />
            <div className="post-studio-hour-dial">
              <button
                type="button"
                onClick={() => setHours(Math.max(0.5, hours - 0.5))}
                className="post-studio-hour-btn"
                aria-label="Decrease hours"
              >
                <Minus size={16} />
              </button>
              <div className="post-studio-hour-value">
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={hours}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isNaN(next) && next >= 0.5 && next <= 24) setHours(next);
                  }}
                  className="w-20 text-center bg-transparent border-none outline-none text-3xl font-bold dash-heading"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                  aria-label="Hours"
                />
                <p className="text-xs dash-subtext mt-0.5">hours</p>
              </div>
              <button
                type="button"
                onClick={() => setHours(Math.min(24, hours + 0.5))}
                className="post-studio-hour-btn"
                aria-label="Increase hours"
              >
                <Plus size={16} />
              </button>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-600 bg-red-50/80 border border-red-200/60 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || isPreview || !title.trim() || !category.trim()}
            className="post-studio-submit disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Posting to community…" : "Post to Community"}
          </button>
        </form>
      ) : (
        <MyListingsPanel onCreateClick={() => setTab("create")} />
      )}
    </div>
  );
};
