import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  LogOut,
  RefreshCw,
  Clock,
  Mail,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  Globe,
  Bell,
  Check,
  X,
  Flag,
} from "lucide-react";
import {
  deleteAdminPost,
  deleteAdminUser,
  fetchAdminPosts,
  fetchAdminProfiles,
  fetchAdminLanguageRequests,
  fetchAdminExchangeReports,
  updateAdminLanguageRequest,
  updateAdminExchangeReport,
  updateAdminPost,
  updateAdminPostStatus,
  updateAdminProfile,
} from "../../../lib/admin";
import type { AdminPost, AdminProfile, ExchangeReport, LanguageRequest } from "../../../types/database";
import { AdminUserPreview } from "./AdminUserPreview";
import { Logo } from "../Logo";
import {
  AdminField,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminTextarea,
} from "./AdminModal";

type Tab = "users" | "posts" | "requests" | "reports" | "preview";

const POST_CATEGORIES = ["Tech", "Labor", "Education", "Music", "Cooking", "Design"];

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
  const [languageRequests, setLanguageRequests] = useState<LanguageRequest[]>([]);
  const [exchangeReports, setExchangeReports] = useState<ExchangeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminProfile | null>(null);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [profilesData, postsData, requestsData, reportsData] = await Promise.all([
        fetchAdminProfiles(adminKey),
        fetchAdminPosts(adminKey),
        fetchAdminLanguageRequests(adminKey),
        fetchAdminExchangeReports(adminKey),
      ]);
      setUsers(profilesData);
      setPosts(postsData);
      setLanguageRequests(requestsData);
      setExchangeReports(reportsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (postId: string, status: "active" | "closed" | "archived") => {
    setActionLoading(true);
    setError(null);
    try {
      await updateAdminPostStatus(adminKey, postId, status);
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, status } : post)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user: AdminProfile) => {
    const name = user.full_name || user.email || "this user";
    if (
      !window.confirm(
        `Permanently delete ${name}? This removes their auth account, profile, posts, exchanges, avatar files, and all sessions. They can sign up again with the same email.`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await deleteAdminUser(adminKey, user.id);
      await loadData();
      if (previewUserId === user.id) setPreviewUserId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePost = async (post: AdminPost) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await deleteAdminPost(adminKey, post.id);
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveUser = async (form: {
    fullName: string;
    email: string;
    hoursAvailable: string;
  }) => {
    if (!editingUser) return;

    setActionLoading(true);
    setError(null);
    try {
      await updateAdminProfile(adminKey, editingUser.id, {
        fullName: form.fullName,
        email: form.email,
        hoursAvailable: parseFloat(form.hoursAvailable),
      });
      await loadData();
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePost = async (form: {
    title: string;
    description: string;
    category: string;
    postType: "needs" | "offers";
    hoursCost: string;
    status: "active" | "closed" | "archived";
  }) => {
    if (!editingPost) return;

    setActionLoading(true);
    setError(null);
    try {
      await updateAdminPost(adminKey, editingPost.id, {
        title: form.title,
        description: form.description,
        category: form.category,
        postType: form.postType,
        hoursCost: parseFloat(form.hoursCost),
        status: form.status,
      });
      await loadData();
      setEditingPost(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post.");
    } finally {
      setActionLoading(false);
    }
  };

  const unreadLanguageRequests = languageRequests.filter(
    (r) => !r.admin_read && r.status === "pending",
  ).length;

  const unreadExchangeReports = exchangeReports.filter(
    (r) => !r.admin_read && r.status === "pending",
  ).length;

  const handleLanguageRequestUpdate = async (
    request: LanguageRequest,
    updates: { status?: LanguageRequest["status"]; adminRead?: boolean },
  ) => {
    setActionLoading(true);
    setError(null);
    try {
      await updateAdminLanguageRequest(adminKey, request.id, updates);
      setLanguageRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: updates.status ?? r.status,
                admin_read: updates.adminRead ?? r.admin_read,
              }
            : r,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update language request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExchangeReportUpdate = async (
    report: ExchangeReport,
    updates: { status?: ExchangeReport["status"]; adminRead?: boolean },
  ) => {
    setActionLoading(true);
    setError(null);
    try {
      await updateAdminExchangeReport(adminKey, report.id, updates);
      setExchangeReports((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? {
                ...r,
                status: updates.status ?? r.status,
                admin_read: updates.adminRead ?? r.admin_read,
              }
            : r,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report.");
    } finally {
      setActionLoading(false);
    }
  };

  if (tab === "preview") {
    return (
      <AdminUserPreview
        adminKey={adminKey}
        users={users}
        initialUserId={previewUserId}
        onExitPreview={() => setTab("users")}
        onExitAdmin={onLogout}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0B0F19" }}>
      <header
        className="sticky top-0 z-10 border-b px-4 py-4 sm:px-6"
        style={{ background: "#0B0F19", borderColor: "#1F2937" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="minimal" size="xs" />
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-400 mb-1">Dev Admin</p>
              <h1 className="text-lg font-semibold text-white">ChronoShare Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadExchangeReports > 0 && (
              <button
                type="button"
                onClick={() => setTab("reports")}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-300 hover:text-red-200 transition-colors"
                style={{ border: "1px solid rgba(248,113,113,0.35)", background: "rgba(248,113,113,0.08)" }}
              >
                <Flag size={14} />
                <span className="hidden sm:inline">
                  {unreadExchangeReports} safety report{unreadExchangeReports === 1 ? "" : "s"}
                </span>
              </button>
            )}
            {unreadLanguageRequests > 0 && (
              <button
                type="button"
                onClick={() => setTab("requests")}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-amber-300 hover:text-amber-200 transition-colors"
                style={{ border: "1px solid rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.08)" }}
              >
                <Bell size={14} />
                <span className="hidden sm:inline">
                  {unreadLanguageRequests} language request{unreadLanguageRequests === 1 ? "" : "s"}
                </span>
                <span
                  className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                  style={{ background: "#FBBF24" }}
                >
                  {unreadLanguageRequests}
                </span>
              </button>
            )}
            {tab !== "preview" && (
              <button
                onClick={loadData}
                disabled={loading || actionLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-colors"
                style={{ border: "1px solid #1F2937" }}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-colors"
              style={{ border: "1px solid #1F2937" }}
            >
              <LogOut size={14} />
              Exit
            </button>
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-6 sm:px-6 ${tab === "preview" ? "max-w-none" : "max-w-6xl"}`}>
        {tab !== "preview" && (
          <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
            <StatCard label="Total Users" value={users.length} />
            <StatCard label="Total Posts" value={posts.length} />
            <StatCard
              label="Active Posts"
              value={posts.filter((p) => p.status === "active").length}
            />
            <StatCard
              label="Safety Reports"
              value={unreadExchangeReports}
              highlight={unreadExchangeReports > 0}
              className="col-span-2 sm:col-span-1"
            />
            <StatCard
              label="Language Requests"
              value={unreadLanguageRequests}
              highlight={unreadLanguageRequests > 0}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        )}

        <div
          className="flex rounded-full p-1 w-fit mb-6"
          style={{ background: "#111827", border: "1px solid #1F2937" }}
        >
          {([
            { id: "users" as const, label: "Users", icon: Users },
            { id: "posts" as const, label: "Posts & Jobs", icon: Briefcase },
            {
              id: "requests" as const,
              label: "Language Requests",
              icon: Globe,
              badge: unreadLanguageRequests,
            },
            {
              id: "reports" as const,
              label: "Safety Reports",
              icon: Flag,
              badge: unreadExchangeReports,
            },
            { id: "preview" as const, label: "User Preview", icon: Eye },
          ]).map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: tab === id ? "#10B981" : "transparent",
                color: tab === id ? "#000" : "#9CA3AF",
              }}
            >
              <Icon size={14} />
              {label}
              {badge ? (
                <span
                  className="min-w-[1.1rem] h-[1.1rem] px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: tab === id ? "#000" : "#FBBF24",
                    color: tab === id ? "#FBBF24" : "#000",
                  }}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {error && tab !== "preview" && (
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
          <UsersTable
            users={users}
            disabled={actionLoading}
            onPreviewUser={(userId) => {
              setPreviewUserId(userId);
              setTab("preview");
            }}
            onEditUser={setEditingUser}
            onDeleteUser={handleDeleteUser}
          />
        ) : tab === "requests" ? (
          <LanguageRequestsTable
            requests={languageRequests}
            disabled={actionLoading}
            onMarkRead={(request) => handleLanguageRequestUpdate(request, { adminRead: true })}
            onMarkAdded={(request) =>
              handleLanguageRequestUpdate(request, { status: "added", adminRead: true })
            }
            onDismiss={(request) =>
              handleLanguageRequestUpdate(request, { status: "dismissed", adminRead: true })
            }
          />
        ) : tab === "reports" ? (
          <ExchangeReportsTable
            reports={exchangeReports}
            disabled={actionLoading}
            onMarkRead={(report) => handleExchangeReportUpdate(report, { adminRead: true })}
            onActionTaken={(report) =>
              handleExchangeReportUpdate(report, { status: "action_taken", adminRead: true })
            }
            onDismiss={(report) =>
              handleExchangeReportUpdate(report, { status: "dismissed", adminRead: true })
            }
          />
        ) : (
          <PostsTable
            posts={posts}
            disabled={actionLoading}
            onStatusChange={handleStatusChange}
            onEditPost={setEditingPost}
            onDeletePost={handleDeletePost}
          />
        )}
      </main>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          loading={actionLoading}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          loading={actionLoading}
          onClose={() => setEditingPost(null)}
          onSave={handleSavePost}
        />
      )}
    </div>
  );
}

function EditUserModal({
  user,
  loading,
  onClose,
  onSave,
}: {
  user: AdminProfile;
  loading: boolean;
  onClose: () => void;
  onSave: (form: { fullName: string; email: string; hoursAvailable: string }) => void;
}) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [hoursAvailable, setHoursAvailable] = useState(String(user.hours_available));

  return (
    <AdminModal
      title="Edit User"
      onClose={onClose}
      onSubmit={() => onSave({ fullName, email, hoursAvailable })}
      submitLabel="Save changes"
      loading={loading}
    >
      <AdminField label="Full name">
        <AdminInput value={fullName} onChange={setFullName} placeholder="Full name" />
      </AdminField>
      <AdminField label="Email">
        <AdminInput value={email} onChange={setEmail} type="email" placeholder="email@example.com" />
      </AdminField>
      <AdminField label="Hours available">
        <AdminInput
          value={hoursAvailable}
          onChange={setHoursAvailable}
          type="number"
          step="0.5"
          min="0"
        />
      </AdminField>
    </AdminModal>
  );
}

function EditPostModal({
  post,
  loading,
  onClose,
  onSave,
}: {
  post: AdminPost;
  loading: boolean;
  onClose: () => void;
  onSave: (form: {
    title: string;
    description: string;
    category: string;
    postType: "needs" | "offers";
    hoursCost: string;
    status: "active" | "closed" | "archived";
  }) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description ?? "");
  const [category, setCategory] = useState(post.category);
  const [postType, setPostType] = useState<"needs" | "offers">(post.post_type);
  const [hoursCost, setHoursCost] = useState(String(post.hours_cost));
  const [status, setStatus] = useState<"active" | "closed" | "archived">(post.status);

  return (
    <AdminModal
      title="Edit Post"
      onClose={onClose}
      onSubmit={() => onSave({ title, description, category, postType, hoursCost, status })}
      submitLabel="Save changes"
      loading={loading}
    >
      <AdminField label="Title">
        <AdminInput value={title} onChange={setTitle} placeholder="Post title" />
      </AdminField>
      <AdminField label="Description">
        <AdminTextarea value={description} onChange={setDescription} placeholder="Description" />
      </AdminField>
      <div className="grid grid-cols-2 gap-3">
        <AdminField label="Category">
          <AdminSelect
            value={category}
            onChange={setCategory}
            options={POST_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </AdminField>
        <AdminField label="Type">
          <AdminSelect
            value={postType}
            onChange={(v) => setPostType(v as "needs" | "offers")}
            options={[
              { value: "needs", label: "Needs help" },
              { value: "offers", label: "Offering skill" },
            ]}
          />
        </AdminField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <AdminField label="Hours cost">
          <AdminInput
            value={hoursCost}
            onChange={setHoursCost}
            type="number"
            step="0.5"
            min="0.5"
          />
        </AdminField>
        <AdminField label="Status">
          <AdminSelect
            value={status}
            onChange={(v) => setStatus(v as "active" | "closed" | "archived")}
            options={[
              { value: "active", label: "Active" },
              { value: "closed", label: "Closed" },
              { value: "archived", label: "Archived" },
            ]}
          />
        </AdminField>
      </div>
      <p className="text-xs text-[#4B5563]">
        Author: {post.author_name} {post.author_email ? `(${post.author_email})` : ""}
      </p>
    </AdminModal>
  );
}

function StatCard({
  label,
  value,
  className = "",
  highlight = false,
}: {
  label: string;
  value: number;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border ${className}`}
      style={{
        background: highlight ? "rgba(251,191,36,0.08)" : "#111827",
        borderColor: highlight ? "rgba(251,191,36,0.35)" : "#1F2937",
      }}
    >
      <p className="text-xs text-[#9CA3AF] mb-1">{label}</p>
      <p
        className="text-2xl font-semibold"
        style={{
          fontFamily: "'DM Mono', monospace",
          color: highlight ? "#FBBF24" : "#fff",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function LanguageRequestsTable({
  requests,
  disabled,
  onMarkRead,
  onMarkAdded,
  onDismiss,
}: {
  requests: LanguageRequest[];
  disabled: boolean;
  onMarkRead: (request: LanguageRequest) => void;
  onMarkAdded: (request: LanguageRequest) => void;
  onDismiss: (request: LanguageRequest) => void;
}) {
  if (requests.length === 0) {
    return <EmptyState message="No language requests yet." />;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const isUnread = !request.admin_read && request.status === "pending";
        return (
          <div
            key={request.id}
            className="rounded-2xl p-5 border"
            style={{
              background: isUnread ? "rgba(251,191,36,0.06)" : "#111827",
              borderColor: isUnread ? "rgba(251,191,36,0.3)" : "#1F2937",
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Globe size={16} className="text-emerald-400" />
                  <h3 className="text-base font-semibold text-white">{request.language_name}</h3>
                  {isUnread && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: "#FBBF24", color: "#000" }}
                    >
                      New
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    style={{
                      background: "rgba(16,185,129,0.12)",
                      color:
                        request.status === "added"
                          ? "#10B981"
                          : request.status === "dismissed"
                            ? "#9CA3AF"
                            : request.status === "reviewed"
                              ? "#60A5FA"
                              : "#FBBF24",
                    }}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF] mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(request.created_at)}
                  </span>
                  {(request.requester_name || request.requester_email) && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} />
                      {request.requester_name ?? "Anonymous"}
                      {request.requester_email ? ` · ${request.requester_email}` : ""}
                    </span>
                  )}
                </div>

                {request.reason && (
                  <p className="text-sm text-[#D1D5DB] leading-relaxed">{request.reason}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {isUnread && (
                  <ActionButton
                    onClick={() => onMarkRead(request)}
                    disabled={disabled}
                    variant="edit"
                    icon={<Check size={12} />}
                    label="Mark read"
                  />
                )}
                {request.status === "pending" && (
                  <>
                    <ActionButton
                      onClick={() => onMarkAdded(request)}
                      disabled={disabled}
                      variant="preview"
                      icon={<Check size={12} />}
                      label="Mark added"
                    />
                    <ActionButton
                      onClick={() => onDismiss(request)}
                      disabled={disabled}
                      variant="delete"
                      icon={<X size={12} />}
                      label="Dismiss"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const REPORT_CATEGORY_LABELS: Record<ExchangeReport["category"], string> = {
  no_show: "No-show",
  incomplete_work: "Incomplete work",
  harassment: "Harassment",
  unsafe: "Felt unsafe",
  scam: "Scam or fraud",
  other: "Other",
};

function ExchangeReportsTable({
  reports,
  disabled,
  onMarkRead,
  onActionTaken,
  onDismiss,
}: {
  reports: ExchangeReport[];
  disabled: boolean;
  onMarkRead: (report: ExchangeReport) => void;
  onActionTaken: (report: ExchangeReport) => void;
  onDismiss: (report: ExchangeReport) => void;
}) {
  if (reports.length === 0) {
    return <EmptyState message="No safety reports yet." />;
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const isUnread = !report.admin_read && report.status === "pending";
        return (
          <div
            key={report.id}
            className="rounded-2xl p-5 border"
            style={{
              background: isUnread ? "rgba(248,113,113,0.06)" : "#111827",
              borderColor: isUnread ? "rgba(248,113,113,0.3)" : "#1F2937",
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Flag size={16} className="text-red-400" />
                  <h3 className="text-base font-semibold text-white">
                    {REPORT_CATEGORY_LABELS[report.category]}
                  </h3>
                  {isUnread && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: "#F87171", color: "#000" }}
                    >
                      New
                    </span>
                  )}
                  {report.also_block && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-[#D1D5DB]">
                      Block requested
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                    style={{
                      background: "rgba(248,113,113,0.12)",
                      color:
                        report.status === "action_taken"
                          ? "#10B981"
                          : report.status === "dismissed"
                            ? "#9CA3AF"
                            : report.status === "reviewed"
                              ? "#60A5FA"
                              : "#F87171",
                    }}
                  >
                    {report.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF] mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(report.created_at)}
                  </span>
                  <span>Reported user: {report.reported_user_id.slice(0, 8)}…</span>
                  {report.exchange_id && <span>Exchange: {report.exchange_id.slice(0, 8)}…</span>}
                </div>

                {report.details && (
                  <p className="text-sm text-[#D1D5DB] leading-relaxed">{report.details}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                {isUnread && (
                  <ActionButton
                    onClick={() => onMarkRead(report)}
                    disabled={disabled}
                    variant="edit"
                    icon={<Check size={12} />}
                    label="Mark read"
                  />
                )}
                {report.status === "pending" && (
                  <>
                    <ActionButton
                      onClick={() => onActionTaken(report)}
                      disabled={disabled}
                      variant="preview"
                      icon={<Check size={12} />}
                      label="Action taken"
                    />
                    <ActionButton
                      onClick={() => onDismiss(report)}
                      disabled={disabled}
                      variant="delete"
                      icon={<X size={12} />}
                      label="Dismiss"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  variant,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant: "edit" | "delete" | "preview";
  icon: React.ReactNode;
  label: string;
}) {
  const styles = {
    edit: { background: "rgba(59,130,246,0.15)", color: "#60A5FA" },
    delete: { background: "rgba(239,68,68,0.15)", color: "#F87171" },
    preview: { background: "rgba(16,185,129,0.15)", color: "#10B981" },
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50"
      style={styles}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function UsersTable({
  users,
  disabled,
  onPreviewUser,
  onEditUser,
  onDeleteUser,
}: {
  users: AdminProfile[];
  disabled: boolean;
  onPreviewUser: (userId: string) => void;
  onEditUser: (user: AdminProfile) => void;
  onDeleteUser: (user: AdminProfile) => void;
}) {
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
              <th className="px-4 py-3 font-medium">Actions</th>
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
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      onClick={() => onPreviewUser(user.id)}
                      disabled={disabled}
                      variant="preview"
                      icon={<Eye size={12} />}
                      label="Preview"
                    />
                    <ActionButton
                      onClick={() => onEditUser(user)}
                      disabled={disabled}
                      variant="edit"
                      icon={<Pencil size={12} />}
                      label="Edit"
                    />
                    <ActionButton
                      onClick={() => onDeleteUser(user)}
                      disabled={disabled}
                      variant="delete"
                      icon={<Trash2 size={12} />}
                      label="Delete"
                    />
                  </div>
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
  disabled,
  onStatusChange,
  onEditPost,
  onDeletePost,
}: {
  posts: AdminPost[];
  disabled: boolean;
  onStatusChange: (postId: string, status: "active" | "closed" | "archived") => void;
  onEditPost: (post: AdminPost) => void;
  onDeletePost: (post: AdminPost) => void;
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
            <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
              <select
                value={post.status}
                disabled={disabled}
                onChange={(e) =>
                  onStatusChange(post.id, e.target.value as "active" | "closed" | "archived")
                }
                className="px-3 py-2 rounded-xl text-xs text-white outline-none cursor-pointer disabled:opacity-50"
                style={{ background: "#0B0F19", border: "1px solid #1F2937" }}
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
              <ActionButton
                onClick={() => onEditPost(post)}
                disabled={disabled}
                variant="edit"
                icon={<Pencil size={12} />}
                label="Edit"
              />
              <ActionButton
                onClick={() => onDeletePost(post)}
                disabled={disabled}
                variant="delete"
                icon={<Trash2 size={12} />}
                label="Delete"
              />
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
