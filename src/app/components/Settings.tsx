import { useState } from "react";
import { useNavigate } from "react-router";
import { KeyRound, Eye, Bell, Mail, Smartphone, Globe, Lock, LogOut, Compass, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className="relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0"
    style={{
      background: value ? "#10B981" : "#1F2937",
      boxShadow: value ? "0 0 10px rgba(16,185,129,0.3)" : "none",
      border: `1px solid ${value ? "#10B981" : "#374151"}`,
    }}
  >
    <span
      className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300"
      style={{
        left: value ? "calc(100% - 22px)" : "2px",
        background: value ? "#fff" : "#6B7280",
      }}
    />
  </button>
);

const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
    >
      <span className="text-emerald-400">{icon}</span>
    </div>
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-[#9CA3AF]">{desc}</p>
    </div>
  </div>
);

const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: "#1F2937" }}>
    <div>
      <p className="text-sm font-medium text-white">{label}</p>
      {desc && <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>}
    </div>
    {children}
  </div>
);

export const Settings = ({
  onLogout,
  onStartTour,
}: {
  onLogout?: () => void;
  onStartTour?: () => void;
}) => {
  const { user, resetOnboarding } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email ?? "");
  const [resetting, setResetting] = useState(false);
  const [toggles, setToggles] = useState({
    publicProfile: true,
    showRating: true,
    showHistory: false,
    emailExchanges: true,
    emailWeekly: false,
    pushMatches: true,
    pushMessages: true,
    twoFactor: false,
  });

  const set = (key: keyof typeof toggles) => (v: boolean) =>
    setToggles((t) => ({ ...t, [key]: v }));

  const handleRestartOnboarding = async () => {
    setResetting(true);
    const err = await resetOnboarding();
    setResetting(false);
    if (!err) navigate("/onboarding", { replace: true });
  };

  const cardProps = {
    className: "rounded-2xl p-5 border mb-4",
    style: { background: "#111827", borderColor: "#1F2937" } as React.CSSProperties,
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Account */}
      <div {...cardProps}>
        <SectionHeader icon={<KeyRound size={16} />} title="Account Details" desc="Manage your login credentials" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all duration-200 focus:ring-1 focus:ring-emerald-500"
              style={{ background: "#0B0F19", border: "1px solid #1F2937" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">Password</label>
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-[#9CA3AF] transition-all duration-200 hover:text-white hover:border-[#374151]"
              style={{ background: "#0B0F19", border: "1px solid #1F2937" }}
            >
              <Lock size={14} />
              Reset password via email
            </button>
          </div>
          <button
            className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:opacity-90"
            style={{ background: "#10B981", color: "#000" }}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div {...cardProps}>
        <SectionHeader icon={<Eye size={16} />} title="Privacy & Security" desc="Control your visibility and account safety" />
        <div>
          <SettingRow label="Public Profile" desc="Let others in the community find you">
            <Toggle value={toggles.publicProfile} onChange={set("publicProfile")} />
          </SettingRow>
          <SettingRow label="Show Community Rating" desc="Display your rating on listings">
            <Toggle value={toggles.showRating} onChange={set("showRating")} />
          </SettingRow>
          <SettingRow label="Show Exchange History" desc="Allow others to see your ledger">
            <Toggle value={toggles.showHistory} onChange={set("showHistory")} />
          </SettingRow>
          <SettingRow label="Two-Factor Authentication" desc="Require a code on new logins">
            <Toggle value={toggles.twoFactor} onChange={set("twoFactor")} />
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div {...cardProps}>
        <SectionHeader icon={<Bell size={16} />} title="Notifications" desc="Choose how you hear about activity" />
        <div>
          <SettingRow label="Email: Exchange Updates" desc="Confirmations and status changes">
            <Toggle value={toggles.emailExchanges} onChange={set("emailExchanges")} />
          </SettingRow>
          <SettingRow label="Email: Weekly Digest" desc="Summary of activity and new listings">
            <Toggle value={toggles.emailWeekly} onChange={set("emailWeekly")} />
          </SettingRow>
          <SettingRow label="Push: New Matches" desc="Notify when someone accepts your post">
            <Toggle value={toggles.pushMatches} onChange={set("pushMatches")} />
          </SettingRow>
          <SettingRow label="Push: Direct Messages" desc="Notify on incoming messages">
            <Toggle value={toggles.pushMessages} onChange={set("pushMessages")} />
          </SettingRow>
        </div>

        {/* Channel icons legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "#1F2937" }}>
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <Mail size={12} /> Email
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <Smartphone size={12} /> Push
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <Globe size={12} /> In-app
          </div>
        </div>
      </div>

      {/* Help */}
      {onStartTour && (
        <div {...cardProps}>
          <SectionHeader
            icon={<Compass size={16} />}
            title="Help & Onboarding"
            desc="Revisit the app walkthrough anytime"
          />
          <SettingRow
            label="App tour"
            desc="Replay the guided walkthrough of navigation and key features"
          >
            <button
              type="button"
              onClick={onStartTour}
              className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:opacity-90"
              style={{ background: "#10B981", color: "#000" }}
            >
              Start tour
            </button>
          </SettingRow>
          <SettingRow
            label="Restart onboarding"
            desc="Go through the welcome wizard again from the beginning"
          >
            <button
              type="button"
              onClick={handleRestartOnboarding}
              disabled={resetting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 hover:bg-white/[0.04] disabled:opacity-60"
              style={{ borderColor: "#374151", color: "#9CA3AF" }}
            >
              <RotateCcw size={12} />
              {resetting ? "Resetting..." : "Restart"}
            </button>
          </SettingRow>
        </div>
      )}

      {/* Danger zone */}
      <div
        className="rounded-2xl p-5 border"
        style={{ background: "#111827", borderColor: "rgba(239,68,68,0.2)" }}
      >
        <p className="text-sm font-semibold text-red-400 mb-1">Danger Zone</p>
        <p className="text-xs text-[#9CA3AF] mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex flex-wrap gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 hover:bg-red-500/10"
              style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444" }}
            >
              <LogOut size={12} />
              Sign out
            </button>
          )}
          <button
            className="px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 hover:bg-red-500/10"
            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444" }}
          >
            Deactivate Account
          </button>
          <button
            className="px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 hover:bg-red-500/20"
            style={{ borderColor: "rgba(239,68,68,0.4)", color: "#EF4444" }}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};
