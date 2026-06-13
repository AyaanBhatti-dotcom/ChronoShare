import { useState } from "react";
import { Monitor, Wrench, BookOpen, Music, ChefHat, Palette, Minus, Plus, CheckCircle2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

const categories = [
  { id: "Tech", label: "Tech", icon: <Monitor size={20} /> },
  { id: "Labor", label: "Labor", icon: <Wrench size={20} /> },
  { id: "Education", label: "Education", icon: <BookOpen size={20} /> },
  { id: "Music", label: "Music", icon: <Music size={20} /> },
  { id: "Cooking", label: "Cooking", icon: <ChefHat size={20} /> },
  { id: "Design", label: "Design", icon: <Palette size={20} /> },
];

export const PostRequest = () => {
  const { user, isPreview } = useAuth();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [postType, setPostType] = useState<"needs" | "offers">("needs");
  const [hours, setHours] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !user) return;

    if (isPreview) {
      setError("Preview mode — posting is disabled.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("posts").insert({
      user_id: user.userId,
      title: title.trim(),
      description: desc.trim() || null,
      category,
      post_type: postType,
      hours_cost: hours,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle("");
      setDesc("");
      setCategory(null);
      setPostType("needs");
      setHours(1);
    }, 2500);
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
        <p className="text-sm text-[#9CA3AF]">Your request is now live on the Job Board.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Post a Request</h2>
        <p className="text-sm text-[#9CA3AF]">Describe what you need or offer and how many hours it&apos;s worth.</p>
        {isPreview && (
          <p className="text-xs text-amber-400 mt-2">Preview mode — form is read-only.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type toggle */}
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
        </div>

        {/* Title */}
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

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe the task in detail — what's involved, any requirements, when you need it done..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#4B5563] outline-none resize-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500"
            style={{ background: "#111827", border: "1px solid #1F2937" }}
          />
        </div>

        {/* Category Grid */}
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

        {/* Duration Stepper */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Duration Cost</label>
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

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || isPreview}
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
  );
};
