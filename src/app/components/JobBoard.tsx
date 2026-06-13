import { useState } from "react";
import {
  Monitor, Wrench, BookOpen, Music, ChefHat, Palette,
  Clock, ChevronDown, Search
} from "lucide-react";

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

const jobs = [
  {
    id: 1, avatar: "SL", name: "Sofia Larsson", title: "Need router setup & network config help",
    category: "Tech", cost: 1.0, type: "needs",
    desc: "My home office setup is a mess. Looking for someone to configure router, set up VLANs, and run cable.",
  },
  {
    id: 2, avatar: "DW", name: "David Winslow", title: "Offering: Advanced Python / Data Science tutoring",
    category: "Education", cost: 1.5, type: "offers",
    desc: "5+ years in ML. Can help with pandas, sklearn, model training, visualization, and interview prep.",
  },
  {
    id: 3, avatar: "PO", name: "Priya Okafor", title: "Drywall patching and interior painting",
    category: "Labor", cost: 2.0, type: "needs",
    desc: "Small bathroom patch + one accent wall repainted. All materials on hand, just need the skilled hands.",
  },
  {
    id: 4, avatar: "LM", name: "Leo Marchand", title: "Offering: Drum lessons for beginners",
    category: "Music", cost: 1.0, type: "offers",
    desc: "I'm a session drummer with 10 years of experience. Happy to teach fundamentals, groove, and basic fills.",
  },
  {
    id: 5, avatar: "NB", name: "Nadia Brennan", title: "Need meal prep coaching for busy week",
    category: "Cooking", cost: 1.5, type: "needs",
    desc: "Help me plan and batch-cook 5 days of healthy meals. Preference for Mediterranean-style food.",
  },
  {
    id: 6, avatar: "RG", name: "Riku Goto", title: "Offering: Figma UI design review & polish",
    category: "Design", cost: 1.0, type: "offers",
    desc: "Senior product designer. Will review your screens, give structured feedback, and suggest improvements.",
  },
];

export const JobBoard = () => {
  const [mode, setMode] = useState<"needs" | "offers">("needs");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((j) => {
    const matchMode = j.type === mode;
    const matchCat = category === "All" || j.category === category;
    const matchSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.name.toLowerCase().includes(search.toLowerCase());
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
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF] text-sm">No listings match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((job) => (
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
                  {job.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#9CA3AF] mb-0.5">{job.name}</p>
                  <h3 className="text-sm font-semibold text-white leading-snug">{job.title}</h3>
                </div>
              </div>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">{job.desc}</p>
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
                    {job.cost}h
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
          ))}
        </div>
      )}
    </div>
  );
};
