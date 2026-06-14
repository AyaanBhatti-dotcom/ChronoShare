import { useEffect, useState } from "react";
import { KeyRound, Eye, Bell, Mail, Smartphone, Globe, Lock, LogOut, Compass, RotateCcw, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { getUserLocation, formatLocationLabel, type UserLocation } from "../../lib/location";
import { fetchProfilePrivacySettings, updateProfileFields } from "../../lib/profile";
import { LocationPicker } from "./LocationPicker";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LANGUAGES } from "../../i18n/languages";

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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [savedLocation, setSavedLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(true);
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

  const set = (key: keyof typeof toggles) => async (v: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: v }));
    if (!user) return;

    const privacyKeys = ["publicProfile", "showRating", "showHistory", "twoFactor"] as const;
    if (!privacyKeys.includes(key as typeof privacyKeys[number])) return;

    try {
      await updateProfileFields(user.userId, {
        showPublicProfile: key === "publicProfile" ? v : toggles.publicProfile,
        showRating: key === "showRating" ? v : toggles.showRating,
        showHistory: key === "showHistory" ? v : toggles.showHistory,
        mfaEnabled: key === "twoFactor" ? v : toggles.twoFactor,
      });
    } catch (err) {
      console.warn("Could not save privacy setting:", err);
      setToggles((prev) => ({ ...prev, [key]: !v }));
    }
  };

  useEffect(() => {
    if (!user) {
      setPrivacyLoading(false);
      return;
    }
    fetchProfilePrivacySettings(user.userId)
      .then((settings) => {
        setToggles((prev) => ({
          ...prev,
          publicProfile: settings.showPublicProfile,
          showRating: settings.showRating,
          showHistory: settings.showHistory,
          twoFactor: settings.mfaEnabled,
        }));
      })
      .catch(console.warn)
      .finally(() => setPrivacyLoading(false));
  }, [user]);

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
        <SectionHeader icon={<KeyRound size={16} />} title={t("settings.accountTitle")} desc={t("settings.accountDesc")} />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="dash-label">{t("settings.emailAddress")}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="dash-input w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="dash-label">{t("auth.password")}</label>
            <button
              className="dash-input w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm dash-subtext transition-all duration-200 hover:dash-heading"
            >
              <Lock size={14} />
              {t("settings.resetViaEmail")}
            </button>
          </div>
          <button className="dash-btn-primary px-4 py-2 rounded-full text-xs font-semibold">
            {t("settings.saveChanges")}
          </button>
        </div>
      </div>

      {/* Language */}
      <div {...cardProps}>
        <SectionHeader
          icon={<Globe size={16} />}
          title={t("settings.languageTitle")}
          desc={t("settings.languageDesc")}
        />
        <SettingRow label={t("common.language")} desc={LANGUAGES.find((l) => l.code === i18n.language.split("-")[0])?.nativeName}>
          <LanguageSwitcher variant="compact" />
        </SettingRow>
      </div>

      {/* Location */}
      <div {...cardProps}>
        <SectionHeader
          icon={<MapPin size={16} />}
          title={t("settings.locationTitle")}
          desc={t("settings.locationDesc")}
        />
        {locationLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {savedLocation && (
              <p className="text-xs dash-subtext mb-4">
                {t("settings.current")}: <span className="dash-accent">{formatLocationLabel(savedLocation)}</span>
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
        <SectionHeader icon={<Eye size={16} />} title={t("settings.privacyTitle")} desc={t("settings.privacyDesc")} />
        {privacyLoading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 rounded-full border-2 dash-spinner border-t-transparent animate-spin" />
          </div>
        ) : (
        <div>
          <SettingRow label={t("settings.publicProfile")} desc={t("settings.publicProfileDesc")}>
            <Toggle value={toggles.publicProfile} onChange={set("publicProfile")} />
          </SettingRow>
          <SettingRow label={t("settings.showRating")} desc={t("settings.showRatingDesc")}>
            <Toggle value={toggles.showRating} onChange={set("showRating")} />
          </SettingRow>
          <SettingRow label={t("settings.showHistory")} desc={t("settings.showHistoryDesc")}>
            <Toggle value={toggles.showHistory} onChange={set("showHistory")} />
          </SettingRow>
          <SettingRow label={t("settings.twoFactor")} desc={t("settings.twoFactorDesc")}>
            <Toggle value={toggles.twoFactor} onChange={set("twoFactor")} />
          </SettingRow>
        </div>
        )}
      </div>

      {/* Notifications */}
      <div {...cardProps}>
        <SectionHeader icon={<Bell size={16} />} title={t("settings.notificationsTitle")} desc={t("settings.notificationsDesc")} />
        <div>
          <SettingRow label={t("settings.emailExchanges")} desc={t("settings.emailExchangesDesc")}>
            <Toggle value={toggles.emailExchanges} onChange={set("emailExchanges")} />
          </SettingRow>
          <SettingRow label={t("settings.emailWeekly")} desc={t("settings.emailWeeklyDesc")}>
            <Toggle value={toggles.emailWeekly} onChange={set("emailWeekly")} />
          </SettingRow>
          <SettingRow label={t("settings.pushMatches")} desc={t("settings.pushMatchesDesc")}>
            <Toggle value={toggles.pushMatches} onChange={set("pushMatches")} />
          </SettingRow>
          <SettingRow label={t("settings.pushMessages")} desc={t("settings.pushMessagesDesc")}>
            <Toggle value={toggles.pushMessages} onChange={set("pushMessages")} />
          </SettingRow>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t dash-divider">
          <div className="flex items-center gap-1.5 text-xs dash-subtext">
            <Mail size={12} /> {t("settings.channelEmail")}
          </div>
          <div className="flex items-center gap-1.5 text-xs dash-subtext">
            <Smartphone size={12} /> {t("settings.channelPush")}
          </div>
          <div className="flex items-center gap-1.5 text-xs dash-subtext">
            <Globe size={12} /> {t("settings.channelInApp")}
          </div>
        </div>
      </div>

      {/* Help */}
      {onRestartOnboarding && (
        <div {...cardProps}>
          <SectionHeader
            icon={<Compass size={16} />}
            title={t("settings.helpTitle")}
            desc={t("settings.helpDesc")}
          />
          <SettingRow
            label={t("settings.restartOnboarding")}
            desc={t("settings.restartOnboardingDesc")}
          >
            <button
              type="button"
              onClick={handleRestartOnboarding}
              disabled={resetting}
              className="dash-btn-outline flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold disabled:opacity-60"
            >
              <RotateCcw size={12} />
              {resetting ? t("settings.resetting") : t("settings.restart")}
            </button>
          </SettingRow>
        </div>
      )}

      {/* Danger zone */}
      <div className="dash-card rounded-2xl p-5 border-red-400/30">
        <p className="text-sm font-semibold text-red-500 mb-1">{t("settings.dangerZone")}</p>
        <p className="text-xs dash-subtext mb-4">{t("settings.dangerDesc")}</p>
        <div className="flex flex-wrap gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 hover:bg-red-500/10"
              style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444" }}
            >
              <LogOut size={12} />
              {t("nav.signOut")}
            </button>
          )}
          <button
            className="px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 hover:bg-red-500/10"
            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444" }}
          >
            {t("settings.deactivate")}
          </button>
          <button
            className="px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 hover:bg-red-500/20"
            style={{ borderColor: "rgba(239,68,68,0.4)", color: "#EF4444" }}
          >
            {t("settings.deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
};
