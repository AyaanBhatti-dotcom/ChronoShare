import { useCallback, useEffect, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  XCircle, RotateCcw, Trash2, Pencil, Check, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyPosts,
  updatePost,
  closePost,
  reopenPost,
  deletePost,
} from "../../lib/posts";
import { fetchMatchedPostIds } from "../../lib/exchanges";
import { formatExchangeFormat, type ExchangeFormatPreference } from "../../lib/exchange-format";
import { ExchangeFormatSelector } from "./ExchangeFormatSelector";
import type { Post } from "../../types/database";

const categories = [
  { id: "Tech", label: "Tech", icon: <Monitor size={16} /> },
  { id: "Labor", label: "Labor", icon: <Wrench size={16} /> },
  { id: "Education", label: "Education", icon: <BookOpen size={16} /> },
  { id: "Music", label: "Music", icon: <Music size={16} /> },
  { id: "Cooking", label: "Cooking", icon: <ChefHat size={16} /> },
  { id: "Design", label: "Design", icon: <Palette size={16} /> },
];

type EditForm = {
  title: string;
  description: string;
  category: string;
  postType: "needs" | "offers";
  hours: number;
  exchangeFormat: ExchangeFormatPreference;
};

function postToEditForm(post: Post): EditForm {
  return {
    title: post.title,
    description: post.description ?? "",
    category: post.category,
    postType: post.post_type,
    hours: post.hours_cost,
    exchangeFormat: post.exchange_format,
  };
}

interface MyListingsPanelProps {
  variant?: "default" | "profile";
  scrollClassName?: string;
  onStatsChange?: (stats: { active: number; total: number }) => void;
  onCreateClick?: () => void;
}

export function MyListingsPanel({
  variant = "default",
  scrollClassName,
  onStatsChange,
  onCreateClick,
}: MyListingsPanelProps) {
  const { user, isPreview } = useAuth();
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchedPostIds, setMatchedPostIds] = useState<Set<string>>(() => new Set());

  const loadMyPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [data, matchedIds] = await Promise.all([fetchMyPosts(user.userId), fetchMatchedPostIds()]);
      setMyPosts(data);
      setMatchedPostIds(new Set(matchedIds));
      onStatsChange?.({
        total: data.length,
        active: data.filter((p) => p.status === "active").length,
      });
    } catch (err) {
      console.warn("Could not load listings:", err);
      setError(err instanceof Error ? err.message : "Could not load listings");
    }
    setLoading(false);
  }, [user, onStatsChange]);

  useEffect(() => {
    loadMyPosts();
  }, [loadMyPosts]);

  const startEdit = (post: Post) => {
    setEditingId(post.id);
    setEditForm(postToEditForm(post));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setError(null);
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editForm || !user) return;

    if (!editForm.title.trim() || !editForm.category) {
      setError("Title and category are required.");
      return;
    }

    if (editForm.postType === "needs" && user.hoursAvailable < editForm.hours) {
      setError(
        `You need at least ${editForm.hours.toFixed(1)} hours in your balance for this request.`,
      );
      return;
    }

    if (isPreview) {
      setError("Preview mode — editing is disabled.");
      return;
    }

    setActionId(postId);
    setError(null);
    try {
      await updatePost(postId, {
        title: editForm.title,
        description: editForm.description || null,
        category: editForm.category,
        postType: editForm.postType,
        hoursCost: editForm.hours,
        exchangeFormat: editForm.exchangeFormat,
      });
      cancelEdit();
      await loadMyPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save listing");
    }
    setActionId(null);
  };

  const handleCloseListing = async (postId: string) => {
    setActionId(postId);
    setError(null);
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
    setError(null);
    try {
      await reopenPost(postId);
      await loadMyPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reopen listing");
    }
    setActionId(null);
  };

  const handleDeleteListing = async (postId: string) => {
    if (!window.confirm("Delete this listing? This can't be undone.")) return;

    setActionId(postId);
    setError(null);
    try {
      await deletePost(postId);
      if (editingId === postId) cancelEdit();
      await loadMyPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete listing");
    }
    setActionId(null);
  };

  const isProfile = variant === "profile";
  const rowClass = isProfile
    ? "flex flex-col gap-3 px-5 py-4 hover:bg-white/20 transition-colors"
    : "dash-card rounded-2xl p-4 flex flex-col gap-3";

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
      </div>
    );
  }

  if (myPosts.length === 0) {
    return (
      <div className={isProfile ? "px-6 py-12 text-center text-sm dash-subtext" : "dash-card text-center py-12 rounded-2xl"}>
        <p className="text-sm dash-subtext mb-3">You haven&apos;t posted any listings yet.</p>
        {onCreateClick && (
          <button
            type="button"
            onClick={onCreateClick}
            className="dash-btn-primary px-5 py-2 rounded-full text-sm font-semibold"
          >
            Create your first listing
          </button>
        )}
      </div>
    );
  }

  const listContent = (
    <>
      {error && (
        <p className={`text-sm text-red-500 ${isProfile ? "px-5 pt-3" : ""}`}>{error}</p>
      )}
      {myPosts.map((post) => {
        const isEditing = editingId === post.id;

        if (isEditing && editForm) {
          return (
            <div key={post.id} className={rowClass}>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold dash-heading uppercase tracking-wide">Edit listing</p>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="dash-btn-outline p-1.5 rounded-full"
                    aria-label="Cancel edit"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="dash-pill-group flex rounded-full p-1 w-fit">
                  {(["needs", "offers"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditForm((f) => f && { ...f, postType: type })}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        editForm.postType === type ? "dash-pill-active" : "dash-pill-inactive"
                      }`}
                    >
                      {type === "needs" ? "Need Help" : "Offering Skill"}
                    </button>
                  ))}
                </div>

                <ExchangeFormatSelector
                  value={editForm.exchangeFormat}
                  onChange={(v) => setEditForm((f) => f && { ...f, exchangeFormat: v as ExchangeFormatPreference })}
                />

                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => f && { ...f, title: e.target.value })}
                  className="dash-input w-full px-3 py-2 rounded-xl text-sm outline-none"
                  placeholder="Title"
                />

                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => f && { ...f, description: e.target.value })}
                  rows={2}
                  className="dash-input w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  placeholder="Description (optional)"
                />

                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setEditForm((f) => f && { ...f, category: cat.id })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        editForm.category === cat.id ? "dash-category-active" : "dash-category-inactive"
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs dash-label">Hours</label>
                  <input
                    type="number"
                    min={0.5}
                    max={8}
                    step={0.5}
                    value={editForm.hours}
                    onChange={(e) =>
                      setEditForm((f) => f && { ...f, hours: Number(e.target.value) || 0.5 })
                    }
                    className="dash-input w-24 px-3 py-1.5 rounded-xl text-sm outline-none"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(post.id)}
                    disabled={actionId === post.id || isPreview}
                    className="dash-btn-primary flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold disabled:opacity-60"
                  >
                    <Check size={13} />
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="dash-btn-outline px-4 py-2 rounded-full text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div key={post.id} className={isProfile ? rowClass : `${rowClass} sm:flex-row sm:items-center`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-semibold dash-heading truncate">{post.title}</h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                    post.status === "active" ? "dash-badge-earn" : "dash-badge-neutral"
                  }`}
                >
                  {post.status}
                </span>
              </div>
              <p className="text-xs dash-subtext">
                {post.post_type === "needs" ? "Need help" : "Offering"} · {post.category} ·{" "}
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{post.hours_cost}h</span>
                {post.exchange_format ? ` · ${formatExchangeFormat(post.exchange_format)}` : ""}
              </p>
              {post.description && (
                <p className="text-xs dash-subtext mt-1 line-clamp-2">{post.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {post.status === "active" && (
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  disabled={actionId === post.id || isPreview}
                  className="dash-btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-60"
                >
                  <Pencil size={13} />
                  Edit
                </button>
              )}
              {post.status === "active" ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCloseListing(post.id)}
                    disabled={actionId === post.id}
                    className="dash-btn-outline flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-60"
                  >
                    <XCircle size={13} />
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteListing(post.id)}
                    disabled={actionId === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-red-400/40 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </>
              ) : post.status === "closed" ? (
                <>
                  {!matchedPostIds.has(post.id) && (
                    <button
                      type="button"
                      onClick={() => handleReopenListing(post.id)}
                      disabled={actionId === post.id}
                      className="dash-link flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[rgba(45,212,200,0.4)] disabled:opacity-60"
                    >
                      <RotateCcw size={13} />
                      Reopen
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteListing(post.id)}
                    disabled={actionId === post.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-red-400/40 text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );

  if (isProfile) {
    const scrollLocked = scrollClassName !== "max-h-none";
    return (
      <div
        className={`divide-y dash-divider ${scrollLocked ? `overflow-y-auto ${scrollClassName ?? "max-h-80"}` : ""}`}
      >
        {listContent}
      </div>
    );
  }

  return <div className="space-y-3">{listContent}</div>;
}
