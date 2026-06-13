import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  LogOut,
  RefreshCw,
  Clock,
  Mail,
  Calendar,
} from "lucide-react";
import {
  fetchAdminPosts,
  fetchAdminProfiles,
  updateAdminPostStatus,
} from "../../../lib/admin";
import type { AdminPost, AdminProfile } from "../../../types/database";

type Tab = "users" | "posts";

interface AdminDashboardProps {
  adminKey: string;
  onLogout: () => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

export function AdminDashboard({ adminKey, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profilesData, postsData] = await Promise.all([
        fetchAdminProfiles(adminKey),
        fetchAdminPosts(adminKey),
      ]);
      setUsers(profilesData);
      setPosts(postsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = () => {
    onLogout();
  };

  const handleStatusChange = async (postId: string, status: "active" | "closed" | "archived") => {
    setStatusUpdating(postId);
    try {
      await updateAdminPostStatus(adminKey, postId, status);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, status } : post)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post status.");
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0B0F19" }}>
      <header
        className="sticky top-0 z-10 border-b px-4 py-4 sm:px-6"
        style={{ background: "#0B0F19", borderColor: "#1F2937" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald-400 mb-1">Dev Admin</p>
            <h1 className="text-lg font-semibold text-white">ChronoShare Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-colors"
              style={{ border: "1px solid #1F2937" }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-colors"
              style={{ border: "1px solid #1F2937" }}
            >
              <LogOut size={14} />
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
          <StatCard label="Total Users" value={users.length} />
          <StatCard label="Total Posts" value={posts.length} />
          <StatCard
            label="Active Posts"
            value={posts.filter((p) => p.status === "active").length}
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <div
          className="flex rounded-full p-1 w-fit mb-6"
          style={{ background: "#111827", border: "1px solid #1F2937" }}
        >
          {([
            { id: "users" as const, label: "Users", icon: Users },
            { id: "posts" as const, label: "Posts & Jobs", icon: Briefcase },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: tab === id ? "#10B981" : "transparent",
                color: tab === id ? "#000" : "#9CA3AF",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : tab === "users" ? (
          <UsersTable users={users} />
        ) : (
          <PostsTable
            posts={posts}
            statusUpdating={statusUpdating}
            onStatusChange={handleStatusChange}
          />
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border ${className}`}
      style={{ background: "#111827", borderColor: "#1F2937" }}
    >
      <p className="text-xs text-[#9CA3AF] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-white" style={{ fontFamily: "'DM Mono', monospace" }}>
        {value}
      </p>
    </div>
  );
}

function UsersTable({ users }: { users: AdminProfile[] }) {
  if (users.length === 0) {
    return <EmptyState message="No users registered yet." />;
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#111827", borderColor: "#1F2937" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[#9CA3AF]" style={{ borderBottom: "1px solid #1F2937" }}>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #1F2937" }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", color: "#000" }}
                    >
                      {initials(user.full_name ?? "?")}
                    </div>
                    <span className="text-white font-medium">{user.full_name || "Unknown"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#9CA3AF]">
                  <span className="flex items-center gap-1.5">
                    <Mail size={12} />
                    {user.email || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-emerald-400" style={{ fontFamily: "'DM Mono', monospace" }}>
                    <Clock size={12} />
                    {user.hours_available}h
                  </span>
                </td>
                <td className="px-4 py-3 text-[#9CA3AF]">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    {formatDate(user.created_at)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PostsTable({
  posts,
  statusUpdating,
  onStatusChange,
}: {
  posts: AdminPost[];
  statusUpdating: string | null;
  onStatusChange: (postId: string, status: "active" | "closed" | "archived") => void;
}) {
  if (posts.length === 0) {
    return <EmptyState message="No posts on the job board yet." />;
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-2xl p-5 border"
          style={{ background: "#111827", borderColor: "#1F2937" }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                  style={{
                    background: post.post_type === "needs" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                    color: post.post_type === "needs" ? "#60A5FA" : "#10B981",
                  }}
                >
                  {post.post_type}
                </span>
                <span className="text-xs text-[#9CA3AF]">{post.category}</span>
                <span
                  className="text-xs font-medium capitalize"
                  style={{
                    color:
                      post.status === "active"
                        ? "#10B981"
                        : post.status === "closed"
                          ? "#F59E0B"
                          : "#9CA3AF",
                  }}
                >
                  {post.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{post.title}</h3>
              {post.description && (
                <p className="text-xs text-[#9CA3AF] mb-2 leading-relaxed">{post.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF]">
                <span>{post.author_name}</span>
                {post.author_email && <span>{post.author_email}</span>}
                <span style={{ fontFamily: "'DM Mono', monospace", color: "#10B981" }}>
                  {post.hours_cost}h
                </span>
                <span>{formatDate(post.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={post.status}
                disabled={statusUpdating === post.id}
                onChange={(e) =>
                  onStatusChange(post.id, e.target.value as "active" | "closed" | "archived")
                }
                className="px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer"
                style={{ background: "#0B0F19", border: "1px solid #1F2937" }}
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-2xl border text-center py-16 text-sm text-[#9CA3AF]"
      style={{ background: "#111827", borderColor: "#1F2937" }}
    >
      {message}
    </div>
  );
}
