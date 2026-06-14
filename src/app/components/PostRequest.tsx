import { useEffect, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  Minus, Plus, CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createPost } from "../../lib/posts";
import { aero } from "./onboarding/aeroTheme";
import { getUserLocation } from "../../lib/location";
import type { ExchangeFormatPreference } from "../../lib/exchange-format";
import { ExchangeFormatSelector } from "./ExchangeFormatSelector";
import { MyListingsPanel } from "./MyListingsPanel";

const categories = [
  { id: "Tech", label: "Tech", icon: <Monitor size={20} /> },
  { id: "Labor", label: "Labor", icon: <Wrench size={20} /> },
  { id: "Education", label: "Education", icon: <BookOpen size={20} /> },
  { id: "Music", label: "Music", icon: <Music size={20} /> },
  { id: "Cooking", label: "Cooking", icon: <ChefHat size={20} /> },
  { id: "Design", label: "Design", icon: <Palette size={20} /> },
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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="dash-icon-box w-16 h-16 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} className="dash-accent-grass" />
        </div>
        <h2 className="text-xl font-semibold dash-heading">Posted to Community!</h2>
        <p className="text-sm dash-subtext">Your listing is now live on the Job Board.</p>
        {onNavigate && (
          <button
            onClick={() => onNavigate("board", { boardMode: lastPostedType })}
            className="dash-btn-primary mt-2 px-6 py-2.5 rounded-full text-sm font-semibold"
          >
            View on Job Board
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold dash-heading mb-1">Create & Manage Listings</h2>
        <p className="text-sm dash-subtext">
          Post in seconds — pick a template or fill in the details.
        </p>
        {isPreview && (
          <p className="text-xs text-amber-400 mt-2">Preview mode — form is read-only.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="dash-pill-group flex rounded-full p-1 w-fit mb-6">
        {(["create", "listings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              tab === t ? "dash-pill-active" : "dash-pill-inactive"
            }`}
          >
            {t === "create" ? "Create" : "My Listings"}
          </button>
        ))}
      </div>

      {tab === "create" ? (
        <div className="space-y-5">
          {/* Quick templates */}
          <div className="space-y-2">
            <label className="dash-label">
              Quick start
            </label>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="dash-tag px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:border-[rgba(45,212,200,0.5)]"
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="dash-label">Listing Type</label>
              <div className="dash-pill-group flex rounded-full p-1 w-fit">
                {(["needs", "offers"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      postType === type ? "dash-pill-active" : "dash-pill-inactive"
                    }`}
                  >
                    {type === "needs" ? "Need Help" : "Offering Skill"}
                  </button>
                ))}
              </div>
              <p className="text-xs dash-subtext opacity-80">
                {postType === "needs"
                  ? "You'll pay hours from your balance to whoever helps you."
                  : "You'll earn hours from the community pool when someone accepts your offer."}
              </p>
            </div>

            <ExchangeFormatSelector
              value={exchangeFormat}
              onChange={setExchangeFormat}
            />

            <div className="space-y-1.5">
              <label className="dash-label">Task Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Need help moving furniture"
                className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="dash-label">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional — add details to help people decide quickly"
                rows={3}
                className="dash-input w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="dash-label">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        active ? "dash-category-active" : "dash-category-inactive"
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="dash-label">Hour Value</label>
              <div className="dash-card flex items-center justify-between p-4 rounded-xl">
                <button
                  type="button"
                  onClick={() => setHours(Math.max(0.5, hours - 0.5))}
                  className="dash-tag w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/40"
                >
                  <Minus size={16} />
                </button>
                <div className="text-center">
                  <p
                    className="text-4xl font-semibold dash-heading"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {hours.toFixed(1)}
                  </p>
                  <p className="text-xs dash-subtext mt-0.5">hours</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHours(Math.min(8, hours + 0.5))}
                  className="dash-btn-outline w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex justify-between px-1">
                {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setHours(v)}
                    className={`text-xs transition-colors duration-200 ${hours === v ? "dash-accent font-semibold" : "dash-subtext"}`}
                  >
                    {v}h
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting || isPreview || !category || !exchangeFormat}
              className="dash-btn-primary w-full py-4 rounded-full text-sm font-semibold active:scale-[0.99] disabled:opacity-60"
              style={{ background: aero.gradientSubmit }}
            >
              {submitting ? "Posting..." : "Post to Community"}
            </button>
          </form>
        </div>
      ) : (
        <MyListingsPanel onCreateClick={() => setTab("create")} />
      )}
    </div>
  );
};
