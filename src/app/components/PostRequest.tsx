import { useCallback, useEffect, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  Minus, Plus, CheckCircle2, Clock, XCircle, RotateCcw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { createPost, fetchMyPosts, closePost, reopenPost } from "../../lib/posts";
import { getUserLocation } from "../../lib/location";
import type { Post } from "../../types/database";

const categories = [
  { id: "Tech", label: "Tech", icon: <Monitor size={20} /> },
  { id: "Labor", label: "Labor", icon: <Wrench size={20} /> },
  { id: "Education", label: "Education", icon: <BookOpen size={20} /> },
  { id: "Music", label: "Music", icon: <Music size={20} /> },
  { id: "Cooking", label: "Cooking", icon: <ChefHat size={20} /> },
  { id: "Design", label: "Design", icon: <Palette size={20} /> },
];

const quickTemplates = [
  { title: "Help moving furniture", category: "Labor", postType: "needs" as const, hours: 2 },
  { title: "Tutoring session", category: "Education", postType: "offers" as const, hours: 1 },
  { title: "Tech support / setup", category: "Tech", postType: "offers" as const, hours: 1.5 },
  { title: "Need a ride to the airport", category: "Labor", postType: "needs" as const, hours: 1 },
  { title: "Meal prep help", category: "Cooking", postType: "needs" as const, hours: 1.5 },
  { title: "Logo or graphic design", category: "Design", postType: "offers" as const, hours: 2 },
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
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [lastPostedType, setLastPostedType] = useState<"needs" | "offers">("needs");

  useEffect(() => {
    setPostType(initialPostType);
  }, [initialPostType]);

  const loadMyPosts = useCallback(async () => {
    if (!user) return;
    setLoadingPosts(true);
    try {
      const data = await fetchMyPosts(user.userId);
      setMyPosts(data);
    } catch (err) {
      console.warn("Could not load listings:", err);
    }
    setLoadingPosts(false);
  }, [user]);

  useEffect(() => {
    if (tab === "listings") loadMyPosts();
  }, [tab, loadMyPosts]);

  const applyTemplate = (template: (typeof quickTemplates)[0]) => {
    setTitle(template.title);
    setCategory(template.category);
    setPostType(template.postType);
    setHours(template.hours);
    setDesc("");
    setTab("create");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !user) return;

    if (isPreview) {
      setError("Preview mode — posting is disabled.");
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
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create listing");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseListing = async (postId: string) => {
    setActionId(postId);
    try {
      await closePost(postId);
      await loadMyPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close listing");
    }
    setActionId(null);
  };

  const handleReopenListing = async (postId: string) => {
    setActionId(postId);
    try {
      await reopenPost(postId);
      await loadMyPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reopen listing");
    }
    setActionId(null);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Posted to Community!</h2>
        <p className="text-sm text-[#9CA3AF]">Your listing is now live on the Job Board.</p>
        {onNavigate && (
          <button
            onClick={() => onNavigate("board", { boardMode: lastPostedType })}
            className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "#10B981", color: "#000" }}
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
        <h2 className="text-xl font-semibold text-white mb-1">Create & Manage Listings</h2>
        <p className="text-sm text-[#9CA3AF]">
          Post in seconds — pick a template or fill in the details.
        </p>
        {isPreview && (
          <p className="text-xs text-amber-400 mt-2">Preview mode — form is read-only.</p>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex rounded-full p-1 w-fit mb-6"
        style={{ background: "#111827", border: "1px solid #1F2937" }}
      >
        {(["create", "listings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: tab === t ? "#10B981" : "transparent",
              color: tab === t ? "#000" : "#9CA3AF",
            }}
          >
            {t === "create" ? "Create" : "My Listings"}
          </button>
        ))}
      </div>

      {tab === "create" ? (
        <div className="space-y-5">
          {/* Quick templates */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
              Quick start
            </label>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((template) => (
                <button
                  key={template.title}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:border-emerald-500/50"
                  style={{ background: "#111827", borderColor: "#1F2937", color: "#9CA3AF" }}
                >
                  {template.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Listing Type</label>
              <div
                className="flex rounded-full p-1 w-fit"
                style={{ background: "#111827", border: "1px solid #1F2937" }}
              >
                {(["needs", "offers"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
                    style={{
                      background: postType === type ? "#10B981" : "transparent",
                      color: postType === type ? "#000" : "#9CA3AF",
                    }}
                  >
                    {type === "needs" ? "Need Help" : "Offering Skill"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#4B5563]">
                {postType === "needs"
                  ? "You'll pay hours to whoever helps you."
                  : "You'll earn hours when someone accepts your offer."}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Task Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Need help moving furniture"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4B5563] outline-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500"
                style={{ background: "#111827", border: "1px solid #1F2937" }}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional — add details to help people decide quickly"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4B5563] outline-none resize-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500"
                style={{ background: "#111827", border: "1px solid #1F2937" }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all duration-200"
                      style={{
                        background: active ? "rgba(16,185,129,0.1)" : "#111827",
                        borderColor: active ? "#10B981" : "#1F2937",
                        color: active ? "#10B981" : "#9CA3AF",
                        boxShadow: active ? "0 0 12px rgba(16,185,129,0.15)" : "none",
                      }}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Hour Value</label>
              <div
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{ background: "#111827", borderColor: "#1F2937" }}
              >
                <button
                  type="button"
                  onClick={() => setHours(Math.max(0.5, hours - 0.5))}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10"
                  style={{ border: "1px solid #1F2937", color: "#9CA3AF" }}
                >
                  <Minus size={16} />
                </button>
                <div className="text-center">
                  <p
                    className="text-4xl font-semibold text-white"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {hours.toFixed(1)}
                  </p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">hours</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHours(Math.min(8, hours + 0.5))}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-emerald-500/10"
                  style={{ border: "1px solid #10B981", color: "#10B981" }}
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
                    className="text-xs transition-colors duration-200"
                    style={{ color: hours === v ? "#10B981" : "#4B5563" }}
                  >
                    {v}h
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting || isPreview || !category}
              className="w-full py-4 rounded-full text-sm font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.99] disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                color: "#000",
                boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
              }}
            >
              {submitting ? "Posting..." : "Post to Community"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          {loadingPosts ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          ) : myPosts.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl border"
              style={{ background: "#111827", borderColor: "#1F2937" }}
            >
              <p className="text-sm text-[#9CA3AF] mb-3">You haven&apos;t posted any listings yet.</p>
              <button
                type="button"
                onClick={() => setTab("create")}
                className="px-5 py-2 rounded-full text-sm font-semibold"
                style={{ background: "#10B981", color: "#000" }}
              >
                Create your first listing
              </button>
            </div>
          ) : (
            myPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl p-4 border flex items-center gap-4"
                style={{ background: "#111827", borderColor: "#1F2937" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-white truncate">{post.title}</h3>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        background: post.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
                        color: post.status === "active" ? "#10B981" : "#9CA3AF",
                      }}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    {post.post_type === "needs" ? "Need help" : "Offering"} · {post.category} ·{" "}
                    <span style={{ fontFamily: "'DM Mono', monospace" }}>{post.hours_cost}h</span>
                  </p>
                </div>
                {post.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => handleCloseListing(post.id)}
                    disabled={actionId === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:border-red-500/50"
                    style={{ borderColor: "#374151", color: "#9CA3AF" }}
                  >
                    <XCircle size={13} />
                    Close
                  </button>
                ) : post.status === "closed" ? (
                  <button
                    type="button"
                    onClick={() => handleReopenListing(post.id)}
                    disabled={actionId === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors hover:border-emerald-500/50"
                    style={{ borderColor: "#374151", color: "#10B981" }}
                  >
                    <RotateCcw size={13} />
                    Reopen
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
