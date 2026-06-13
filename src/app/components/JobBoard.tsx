import { useEffect, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  Clock, ChevronDown, Search
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getInitials } from "../context/AuthContext";
import type { PostWithAuthor } from "../../types/database";

const categories = ["All", "Tech", "Labor", "Education", "Music", "Cooking", "Design"];

const categoryIcon = (cat: string) => {
  const map: Record<string, React.ReactNode> = {
    Tech: <Monitor size={14} />,
    Labor: <Wrench size={14} />,
    Education: <BookOpen size={14} />,
    Music: <Music size={14} />,
    Cooking: <ChefHat size={14} />,
    Design: <Palette size={14} />,
  };
  return map[cat] || <Monitor size={14} />;
};

export const JobBoard = () => {
  const [mode, setMode] = useState<"needs" | "offers">("needs");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, description, category, post_type, hours_cost, profiles(full_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        console.warn("Could not load posts:", error.message);
        setJobs([]);
      } else {
        setJobs((data ?? []) as PostWithAuthor[]);
      }
      setLoading(false);
    }

    loadPosts();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = jobs.filter((j) => {
    const authorName = j.profiles?.full_name ?? "User";
    const matchMode = j.post_type === mode;
    const matchCat = category === "All" || j.category === category;
    const matchSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      authorName.toLowerCase().includes(search.toLowerCase());
    return matchMode && matchCat && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Toggle */}
        <div
          className="flex rounded-full p-1 w-fit"
          style={{ background: "#111827", border: "1px solid #1F2937" }}
        >
          {(["needs", "offers"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: mode === m ? "#10B981" : "transparent",
                color: mode === m ? "#000" : "#9CA3AF",
              }}
            >
              {m === "needs" ? "Needs Help" : "Offering Skills"}
            </button>
          ))}
        </div>

        {/* Search + Category */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 sm:w-48"
            style={{ background: "#111827", border: "1px solid #1F2937" }}
          >
            <Search size={14} className="text-[#9CA3AF]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="bg-transparent text-sm text-white placeholder-[#9CA3AF] outline-none w-full"
            />
          </div>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none cursor-pointer"
              style={{ background: "#111827", border: "1px solid #1F2937" }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF] text-sm">No listings match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((job) => {
            const name = job.profiles?.full_name ?? "User";
            return (
              <div
                key={job.id}
                className="rounded-2xl p-5 border flex flex-col gap-4 hover:border-emerald-500/40 transition-all duration-200 group"
                style={{ background: "#111827", borderColor: "#1F2937" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                  >
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#9CA3AF] mb-0.5">{name}</p>
                    <h3 className="text-sm font-semibold text-white leading-snug">{job.title}</h3>
                  </div>
                </div>
                {job.description && (
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">{job.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                      style={{ background: "#1F2937", borderColor: "#374151", color: "#9CA3AF" }}
                    >
                      {categoryIcon(job.category)}
                      {job.category}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ fontFamily: "'DM Mono', monospace", color: "#10B981" }}
                    >
                      <Clock size={11} />
                      {job.hours_cost}h
                    </span>
                  </div>
                  <button
                    className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "#10B981", color: "#000" }}
                  >
                    Accept
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
