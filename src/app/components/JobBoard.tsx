import { useCallback, useEffect, useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  Clock, ChevronDown, Search, X, ArrowUpRight, ArrowDownRight,
  CheckCircle2, PlusCircle,
} from "lucide-react";
import { useAuth, getInitials } from "../context/AuthContext";
import { fetchActivePosts } from "../../lib/posts";
import { acceptPost, getHourImpact } from "../../lib/exchanges";
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

type BoardMode = "all" | "needs" | "offers";

interface JobBoardProps {
  onNavigate?: (screen: string, options?: { postType?: "needs" | "offers"; boardMode?: BoardMode }) => void;
  initialMode?: BoardMode;
}

export const JobBoard = ({ onNavigate, initialMode = "all" }: JobBoardProps) => {
  const { user, refreshUser, isPreview } = useAuth();
  const [mode, setMode] = useState<BoardMode>(initialMode);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PostWithAuthor | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptSuccess, setAcceptSuccess] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActivePosts();
      setJobs(data);
    } catch (err) {
      console.warn("Could not load posts:", err);
      setJobs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const filtered = jobs.filter((j) => {
    const authorName = j.profiles?.full_name ?? "User";
    const matchMode = mode === "all" || j.post_type === mode;
    const matchCat = category === "All" || j.category === category;
    const matchSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      authorName.toLowerCase().includes(search.toLowerCase()) ||
      (j.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchMode && matchCat && matchSearch;
  });

  const handleAccept = async () => {
    if (!selectedJob || isPreview || (user && selectedJob.user_id === user.userId)) return;

    setAccepting(true);
    setAcceptError(null);

    try {
      await acceptPost(selectedJob.id);
      await refreshUser();
      setAcceptSuccess(true);
      setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id));
      setTimeout(() => {
        setSelectedJob(null);
        setAcceptSuccess(false);
      }, 2000);
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : "Could not accept listing");
    } finally {
      setAccepting(false);
    }
  };

  const hourImpact = selectedJob && user && selectedJob.user_id !== user.userId
    ? getHourImpact(selectedJob.post_type, true, selectedJob.hours_cost)
    : null;

  const isOwnSelected = user && selectedJob?.user_id === user.userId;

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex rounded-full p-1 w-fit"
          style={{ background: "#111827", border: "1px solid #1F2937" }}
        >
          {(["all", "needs", "offers"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: mode === m ? "#10B981" : "transparent",
                color: mode === m ? "#000" : "#9CA3AF",
              }}
            >
              {m === "all" ? "All Listings" : m === "needs" ? "Needs Help" : "Offering Skills"}
            </button>
          ))}
        </div>

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
        <div
          className="text-center py-16 rounded-2xl border"
          style={{ background: "#111827", borderColor: "#1F2937" }}
        >
          <p className="text-[#9CA3AF] text-sm mb-4">
            {jobs.length === 0
              ? "No active listings yet. Be the first to post!"
              : mode !== "all"
                ? `No ${mode === "needs" ? "help requests" : "skill offers"} match your filters. Try "All Listings".`
                : "No listings match your filters."}
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate("post")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#10B981", color: "#000" }}
            >
              <PlusCircle size={16} />
              Create a listing
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((job) => {
            const name = job.profiles?.full_name ?? "User";
            const isOwn = user?.userId === job.user_id;
            const impact = getHourImpact(job.post_type, true, job.hours_cost);
            return (
              <button
                key={job.id}
                type="button"
                onClick={() => {
                  setSelectedJob(job);
                  setAcceptError(null);
                  setAcceptSuccess(false);
                }}
                className="rounded-2xl p-5 border flex flex-col gap-4 hover:border-emerald-500/40 transition-all duration-200 group text-left"
                style={{
                  background: "#111827",
                  borderColor: isOwn ? "rgba(16,185,129,0.35)" : "#1F2937",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                  >
                    {getInitials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs text-[#9CA3AF]">{name}</p>
                      {isOwn && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                        >
                          Your listing
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white leading-snug">{job.title}</h3>
                  </div>
                </div>
                {job.description && (
                  <p className="text-xs text-[#9CA3AF] leading-relaxed line-clamp-2">{job.description}</p>
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
                  {isOwn ? (
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-semibold"
                      style={{ background: "#1F2937", color: "#9CA3AF" }}
                    >
                      Live on board
                    </span>
                  ) : (
                    <span
                      className="px-4 py-1.5 rounded-full text-xs font-semibold"
                      style={{
                        background: impact.direction === "earn" ? "rgba(16,185,129,0.15)" : "rgba(6,182,212,0.15)",
                        color: impact.direction === "earn" ? "#10B981" : "#06B6D4",
                      }}
                    >
                      {impact.direction === "earn" ? "Earn" : "Spend"} {impact.amount}h
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail / Accept modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !accepting && setSelectedJob(null)}
          />
          <div
            className="relative w-full max-w-md rounded-2xl border p-6 space-y-5"
            style={{ background: "#111827", borderColor: "#1F2937" }}
          >
            <button
              type="button"
              onClick={() => !accepting && setSelectedJob(null)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {acceptSuccess ? (
              <div className="flex flex-col items-center py-8 gap-3 text-center">
                <CheckCircle2 size={40} className="text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">You&apos;re matched!</h3>
                <p className="text-sm text-[#9CA3AF]">
                  Check your profile to manage this exchange.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">
                    {selectedJob.profiles?.full_name ?? "Community member"}
                  </p>
                  <h3 className="text-lg font-semibold text-white">{selectedJob.title}</h3>
                </div>

                {selectedJob.description && (
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{selectedJob.description}</p>
                )}

                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{ background: "#1F2937", borderColor: "#374151", color: "#9CA3AF" }}
                  >
                    {categoryIcon(selectedJob.category)}
                    {selectedJob.category}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ fontFamily: "'DM Mono', monospace", color: "#10B981" }}
                  >
                    {selectedJob.hours_cost}h
                  </span>
                  <span className="text-xs text-[#9CA3AF] capitalize">
                    {selectedJob.post_type === "needs" ? "Needs help" : "Offering skill"}
                  </span>
                </div>

                {hourImpact && (
                  <div
                    className="rounded-xl p-4 flex items-center gap-3"
                    style={{
                      background: hourImpact.direction === "earn"
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(6,182,212,0.1)",
                      border: `1px solid ${hourImpact.direction === "earn" ? "rgba(16,185,129,0.25)" : "rgba(6,182,212,0.25)"}`,
                    }}
                  >
                    {hourImpact.direction === "earn" ? (
                      <ArrowUpRight size={20} className="text-emerald-400" />
                    ) : (
                      <ArrowDownRight size={20} className="text-cyan-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        You&apos;ll {hourImpact.direction === "earn" ? "earn" : "spend"}{" "}
                        {hourImpact.amount}h
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        {hourImpact.direction === "earn"
                          ? "Hours transfer to you when you join this exchange."
                          : `Requires ${hourImpact.amount}h in your balance.`}
                      </p>
                    </div>
                  </div>
                )}

                {acceptError && (
                  <p className="text-sm text-red-400">{acceptError}</p>
                )}

                {isOwnSelected ? (
                  <div
                    className="rounded-xl p-4 text-center"
                    style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    <p className="text-sm text-emerald-400 font-medium">This is your listing</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Others can find and join it here. Manage it under My Listings.
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJob(null);
                          onNavigate("post");
                        }}
                        className="mt-3 text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Go to My Listings
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAccept}
                    disabled={accepting || isPreview}
                    className="w-full py-3.5 rounded-full text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ background: "#10B981", color: "#000" }}
                  >
                    {accepting ? "Joining..." : isPreview ? "Preview mode" : "Join this exchange"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
