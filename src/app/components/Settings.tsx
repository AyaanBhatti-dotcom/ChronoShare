import { useEffect, useState } from "react";
import { KeyRound, Eye, Bell, Mail, Smartphone, Globe, Lock, LogOut, Compass, RotateCcw, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getUserLocation, formatLocationLabel, type UserLocation } from "../../lib/location";
import { LocationPicker } from "./LocationPicker";

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
      value ? "dash-toggle-on" : "dash-toggle-off"
    }`}
  >
    <span
      className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 bg-white shadow-sm"
      style={{ left: value ? "calc(100% - 22px)" : "2px" }}
    />
  </button>
);

const SectionHeader = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
  <div className="flex items-start gap-3 mb-4">
    <div className="dash-icon-box w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
      <span className="dash-accent">{icon}</span>
    </div>
    <div>
      <h3 className="text-sm font-semibold dash-heading">{title}</h3>
      <p className="text-xs dash-subtext">{desc}</p>
    </div>
  </div>
);

const SettingRow = ({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3.5 border-b dash-divider last:border-b-0">
    <div>
      <p className="text-sm font-medium dash-heading">{label}</p>
      {desc && <p className="text-xs dash-subtext mt-0.5">{desc}</p>}
    </div>
    {children}
  </div>
);

export const Settings = ({
  onLogout,
  onRestartOnboarding,
}: {
  onLogout?: () => void;
  onRestartOnboarding?: () => Promise<void>;
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [savedLocation, setSavedLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
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

  useEffect(() => {
    if (!user) {
      setLocationLoading(false);
      return;
    }
    getUserLocation(user.userId)
      .then(setSavedLocation)
      .catch(console.warn)
      .finally(() => setLocationLoading(false));
  }, [user]);

  const handleRestartOnboarding = async () => {
    if (!onRestartOnboarding) return;
    setResetting(true);
    await onRestartOnboarding();
    setResetting(false);
  };

  const cardProps = {
    className: "dash-card rounded-2xl p-5 mb-4",
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Account */}
      <div {...cardProps}>
        <SectionHeader icon={<KeyRound size={16} />} title="Account Details" desc="Manage your login credentials" />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="dash-label">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dash-input w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="dash-label">Password</label>
            <button
              className="dash-input w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm dash-subtext transition-all duration-200 hover:dash-heading"
            >
              <Lock size={14} />
              Reset password via email
            </button>
          </div>
          <button className="dash-btn-primary px-4 py-2 rounded-full text-xs font-semibold">
            Save Changes
          </button>
        </div>
      </div>

      {/* Location */}
      <div {...cardProps}>
        <SectionHeader
          icon={<MapPin size={16} />}
          title="Your Location"
          desc="Used for nearby listings and map — search any city worldwide"
        />
        {locationLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {savedLocation && (
              <p className="text-xs dash-subtext mb-4">
                Current: <span className="dash-accent">{formatLocationLabel(savedLocation)}</span>
              </p>
            )}
            <LocationPicker
              initialLocation={savedLocation}
              onSaved={setSavedLocation}
              compact
              showSuccessMessage
            />
          </>
        )}
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
        <div className="flex items-center gap-4 mt-3 pt-3 border-t dash-divider">
          <div className="flex items-center gap-1.5 text-xs dash-subtext">
            <Mail size={12} /> Email
          </div>
          <div className="flex items-center gap-1.5 text-xs dash-subtext">
            <Smartphone size={12} /> Push
          </div>
          <div className="flex items-center gap-1.5 text-xs dash-subtext">
            <Globe size={12} /> In-app
          </div>
        </div>
      </div>

      {/* Help */}
      {onRestartOnboarding && (
        <div {...cardProps}>
          <SectionHeader
            icon={<Compass size={16} />}
            title="Help & Onboarding"
            desc="Revisit the dashboard walkthrough anytime"
          />
          <SettingRow
            label="Restart onboarding"
            desc="Reset and walk through the full dashboard tour again"
          >
            <button
              type="button"
              onClick={handleRestartOnboarding}
              disabled={resetting}
              className="dash-btn-outline flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold disabled:opacity-60"
            >
              <RotateCcw size={12} />
              {resetting ? "Resetting..." : "Restart"}
            </button>
          </SettingRow>
        </div>
      )}

      {/* Danger zone */}
      <div className="dash-card rounded-2xl p-5 border-red-400/30">
        <p className="text-sm font-semibold text-red-500 mb-1">Danger Zone</p>
        <p className="text-xs dash-subtext mb-4">These actions are permanent and cannot be undone.</p>
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
