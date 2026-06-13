import { useEffect, useMemo, useState } from "react";
import { Eye, ChevronDown } from "lucide-react";
import { AuthPreviewProvider, type Session } from "../../context/AuthContext";
import { DashboardLayout } from "../DashboardLayout";
import type { AdminProfile } from "../../../types/database";

const SAMPLE_USER: Session = {
  userId: "00000000-0000-0000-0000-000000000000",
  name: "Sample User",
  username: "sample_user",
  email: "sample@chronoshare.app",
  avatarUrl: null,
  hoursAvailable: 1.0,
  profileSetupCompleted: true,
  onboardingCompleted: true,
};

function toSession(profile: AdminProfile): Session {
  return {
    userId: profile.id,
    name: profile.full_name || "Unknown",
    username: null,
    email: profile.email || "",
    avatarUrl: null,
    hoursAvailable: Number(profile.hours_available) || 1.0,
    profileSetupCompleted: true,
    onboardingCompleted: true,
  };
}

interface AdminUserPreviewProps {
  users: AdminProfile[];
  initialUserId?: string | null;
  onExitPreview: () => void;
}

export function AdminUserPreview({
  users,
  initialUserId,
  onExitPreview,
}: AdminUserPreviewProps) {
  const options = useMemo(
    () => [
      ...users.map((user) => ({ id: user.id, label: user.full_name || user.email || "Unknown" })),
      { id: "sample", label: "Sample User (demo)" },
    ],
    [users],
  );

  const [selectedId, setSelectedId] = useState(
    () => initialUserId ?? users[0]?.id ?? "sample",
  );

  useEffect(() => {
    if (initialUserId) {
      setSelectedId(initialUserId);
    }
  }, [initialUserId]);

  const previewUser = useMemo(() => {
    if (selectedId === "sample") return SAMPLE_USER;
    const profile = users.find((user) => user.id === selectedId);
    return profile ? toSession(profile) : SAMPLE_USER;
  }, [selectedId, users]);

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[32rem] rounded-2xl border overflow-hidden"
      style={{ borderColor: "#1F2937" }}
    >
      <div
        className="flex flex-wrap items-center gap-3 px-4 py-3 border-b flex-shrink-0"
        style={{ background: "#111827", borderColor: "#1F2937" }}
      >
        <div className="flex items-center gap-2 text-emerald-400">
          <Eye size={16} />
          <span className="text-xs font-medium uppercase tracking-wide">User Preview</span>
        </div>

        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl text-sm text-white outline-none cursor-pointer"
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

        <p className="text-xs text-[#9CA3AF]">
          Viewing the dashboard as a regular user. Actions like posting are disabled.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <AuthPreviewProvider user={previewUser}>
          <DashboardLayout previewMode onExitPreview={onExitPreview} />
        </AuthPreviewProvider>
      </div>
    </div>
  );
}
