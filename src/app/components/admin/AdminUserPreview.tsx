import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Eye, Loader2, LogOut, UserRound } from "lucide-react";
import { AuthPreviewProvider, type Session } from "../../context/AuthContext";
import { PreviewDashboardProvider } from "../../context/PreviewDashboardContext";
import { DashboardLayout } from "../DashboardLayout";
import {
  fetchAdminUserPreview,
  SAMPLE_PREVIEW,
  type AdminUserPreviewData,
} from "../../../lib/admin-preview";
import type { AdminProfile } from "../../../types/database";
import { formatLocationLabel } from "../../../lib/location";

interface AdminUserPreviewProps {
  adminKey: string;
  users: AdminProfile[];
  initialUserId?: string | null;
  onExitPreview: () => void;
  onExitAdmin: () => void;
}

export function AdminUserPreview({
  adminKey,
  users,
  initialUserId,
  onExitPreview,
  onExitAdmin,
}: AdminUserPreviewProps) {
  const options = useMemo(
    () => [
      ...users.map((user) => ({
        id: user.id,
        label: user.full_name || user.email || "Unknown",
      })),
      { id: "sample", label: "Sample user (demo)" },
    ],
    [users],
  );

  const [selectedId, setSelectedId] = useState(
    () => initialUserId ?? users[0]?.id ?? "sample",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session>(SAMPLE_PREVIEW.session);
  const [snapshot, setSnapshot] = useState<AdminUserPreviewData>(SAMPLE_PREVIEW.snapshot);

  useEffect(() => {
    if (initialUserId) {
      setSelectedId(initialUserId);
    }
  }, [initialUserId]);

  useEffect(() => {
    let cancelled = false;

    if (selectedId === "sample") {
      setSession(SAMPLE_PREVIEW.session);
      setSnapshot(SAMPLE_PREVIEW.snapshot);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchAdminUserPreview(adminKey, selectedId)
      .then((result) => {
        if (cancelled) return;
        setSession(result.session);
        setSnapshot(result.snapshot);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load user preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adminKey, selectedId]);

  const previewLabel = session.username
    ? `@${session.username}`
    : session.name;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0B0F19" }}>
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ background: "#111827", borderColor: "#1F2937" }}
      >
        <button
          type="button"
          onClick={onExitPreview}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-colors"
          style={{ border: "1px solid #1F2937" }}
        >
          <ArrowLeft size={14} />
          Admin panel
        </button>

        <div className="flex items-center gap-2 text-emerald-400">
          <Eye size={16} />
          <span className="text-xs font-semibold uppercase tracking-wide">User preview</span>
        </div>

        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none cursor-pointer min-w-[12rem]"
            style={{ background: "#0B0F19", border: "1px solid #1F2937" }}
          >
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-[#9CA3AF] min-w-0">
          <UserRound size={14} className="flex-shrink-0" />
          <span className="truncate">
            Viewing as <span className="text-white font-medium">{previewLabel}</span>
            {snapshot.location
              ? ` · ${formatLocationLabel(snapshot.location)}`
              : " · No location saved"}
            {" · "}
            {session.hoursAvailable.toFixed(1)}h
          </span>
        </div>

        {loading && (
          <Loader2 size={16} className="animate-spin text-emerald-400 ml-auto" />
        )}

        <button
          type="button"
          onClick={onExitAdmin}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-colors ml-auto sm:ml-0"
          style={{ border: "1px solid #1F2937" }}
        >
          <LogOut size={14} />
          Exit admin
        </button>
      </div>

      {error && (
        <div
          className="px-4 py-2 text-sm text-red-400 flex-shrink-0"
          style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}
        >
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        <PreviewDashboardProvider value={snapshot}>
          <AuthPreviewProvider user={session}>
            <DashboardLayout previewMode onExitPreview={onExitPreview} />
          </AuthPreviewProvider>
        </PreviewDashboardProvider>
      </div>
    </div>
  );
}
