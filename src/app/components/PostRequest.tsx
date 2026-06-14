import { useEffect, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  Minus, Plus, CheckCircle2, Sparkles, PenLine, Layers,
  HandHelping, Zap, Clock, FolderOpen, Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../../lib/posts";
import { getUserLocation } from "../../lib/location";
import type { ExchangeFormatPreference } from "../../lib/exchange-format";
import { ExchangeFormatSelector } from "./ExchangeFormatSelector";
import { MyListingsPanel } from "./MyListingsPanel";

const categories = [
  { id: "Tech", label: "Tech", icon: <Monitor size={18} /> },
  { id: "Labor", label: "Labor", icon: <Wrench size={18} /> },
  { id: "Education", label: "Education", icon: <BookOpen size={18} /> },
  { id: "Music", label: "Music", icon: <Music size={18} /> },
  { id: "Cooking", label: "Cooking", icon: <ChefHat size={18} /> },
  { id: "Design", label: "Design", icon: <Palette size={18} /> },
];

const quickTemplates = [
  { title: "Help moving furniture", category: "Labor", hours: 2 },
  { title: "Tutoring session", category: "Education", hours: 1 },
  { title: "Tech support / setup", category: "Tech", hours: 1.5 },
  { title: "Need a ride to the airport", category: "Labor", hours: 1 },
  { title: "Meal prep help", category: "Cooking", hours: 1.5 },
  { title: "Logo or graphic design", category: "Design", hours: 2 },
];

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
  const [category, setCategory] = useState<string | null>(null);
  const [postType, setPostType] = useState<"needs" | "offers">(initialPostType);
  const [hours, setHours] = useState(1);
  const [exchangeFormat, setExchangeFormat] = useState<ExchangeFormatPreference | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastPostedType, setLastPostedType] = useState<"needs" | "offers">("needs");

  useEffect(() => {
    setPostType(initialPostType);
  }, [initialPostType]);

  const applyTemplate = (template: (typeof quickTemplates)[0]) => {
    setTitle(template.title);
    setCategory(template.category);
    setHours(template.hours);
    setDesc("");
    setTab("create");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !user) return;

    if (!exchangeFormat) {
      setError("Choose how this exchange will happen — in person, remote, or either.");
      return;
    }

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
        title,
        description: desc || null,
        category,
        postType,
        hoursCost: hours,
        exchangeFormat,
        location,
      });
      setLastPostedType(postType);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle("");
        setDesc("");
        setCategory(null);
        setPostType(initialPostType);
        setHours(1);
        setExchangeFormat(null);
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
            Post what you need or what you offer — the community trades in hours, not dollars.
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
        <div className="flex flex-col gap-3">
          <section className="post-studio-section">
            <SectionHead
              icon={<Zap size={15} />}
              label="Quick start"
              hint="Tap a template to pre-fill — tweak anything before posting."
            />
            <div className="post-studio-templates">
              {quickTemplates.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="post-studio-template"
                >
                  <span className="post-studio-template-dot" aria-hidden />
                  {template.title}
                </button>
              ))}
            </div>
          </section>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <section className="post-studio-section">
              <SectionHead
                icon={<Layers size={15} />}
                label="Listing type"
                hint="Choose whether you're asking for help or sharing a skill."
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
                icon={<Monitor size={15} />}
                label="Exchange format"
                hint="How will this happen — in person, remote, or flexible?"
              />
              <ExchangeFormatSelector
                value={exchangeFormat}
                onChange={setExchangeFormat}
                variant="studio"
                hideLabel
              />
            </section>

            <section className="post-studio-section">
              <SectionHead
                icon={<PenLine size={15} />}
                label="Details"
                hint="A clear title helps neighbors decide quickly."
              />
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="post-studio-section-label" htmlFor="listing-title">
                    Task title
                  </label>
                  <input
                    id="listing-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Need help moving furniture"
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
                    placeholder="Optional — timing, location notes, or special requirements"
                    rows={3}
                    className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all duration-200"
                  />
                </div>
              </div>
            </section>

            <section className="post-studio-section">
              <SectionHead
                icon={<Palette size={15} />}
                label="Category"
                hint="Pick the area that best fits your listing."
              />
              <div className="post-studio-cat-grid">
                {categories.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(cat.id)}
                      className={`post-studio-cat-tile ${active ? "post-studio-cat-tile-active" : ""}`}
                    >
                      {active && (
                        <span className="post-studio-pick-badge" aria-hidden>
                          <Check size={9} strokeWidth={3} />
                        </span>
                      )}
                      <span className="post-studio-cat-icon">{cat.icon}</span>
                      {cat.label}
                    </button>
                  );
                })}
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
                  <p className="post-studio-hour-num">{hours.toFixed(1)}</p>
                  <p className="text-xs dash-subtext mt-0.5">hours</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHours(Math.min(8, hours + 0.5))}
                  className="post-studio-hour-btn"
                  aria-label="Increase hours"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="post-studio-hour-presets">
                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setHours(v)}
                    className={`post-studio-hour-preset ${hours === v ? "post-studio-hour-preset-active" : ""}`}
                  >
                    {v}h
                  </button>
                ))}
              </div>
            </section>

            {error && (
              <p className="text-sm text-red-600 bg-red-50/80 border border-red-200/60 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || isPreview || !category || !exchangeFormat}
              className="post-studio-submit disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Posting to community…" : "Post to Community"}
            </button>
          </form>
        </div>
      ) : (
        <MyListingsPanel onCreateClick={() => setTab("create")} />
      )}
    </div>
  );
};
