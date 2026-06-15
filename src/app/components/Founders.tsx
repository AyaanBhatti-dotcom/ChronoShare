import { useTranslation } from "react-i18next";
import { Crown } from "lucide-react";

const FOUNDERS = [
  {
    id: "jungl3master",
    image: "/founders/jungl3master.png",
    nameKey: "founders.jungl3master.name",
    roleKey: "founders.jungl3master.role",
    bioKey: "founders.jungl3master.bio",
  },
  {
    id: "atlas",
    image: "/founders/atlas-morphoenix.png",
    nameKey: "founders.atlas.name",
    roleKey: "founders.atlas.role",
    bioKey: "founders.atlas.bio",
  },
  {
    id: "daniela",
    image: "/founders/daniela-parra.png",
    nameKey: "founders.daniela.name",
    roleKey: "founders.daniela.role",
    bioKey: "founders.daniela.bio",
  },
] as const;

export function Founders() {
  const { t } = useTranslation();

  return (
    <div className="founders-scene">
      <div className="founders-win98-window">
        <div className="founders-win98-titlebar">
          <div className="founders-win98-title">
            <Crown size={12} strokeWidth={2.25} aria-hidden />
            <span className="founders-win98-title-text">{t("founders.title")}</span>
            <span className="founders-win98-title-sub">— ChronoShare</span>
          </div>
          <div className="founders-win98-controls" aria-hidden>
            <span className="founders-win98-btn founders-win98-btn-min" />
            <span className="founders-win98-btn founders-win98-btn-max" />
            <span className="founders-win98-btn founders-win98-btn-close" />
          </div>
        </div>

        <div className="founders-win98-toolbar">
          <span>{t("founders.subtitle")}</span>
        </div>

        <div className="founders-win98-body">
          <div className="founders-win98-aero-sun" aria-hidden />
          <div className="founders-win98-aero-cloud founders-win98-aero-cloud-a" aria-hidden />
          <div className="founders-win98-aero-cloud founders-win98-aero-cloud-b" aria-hidden />

          <div className="founders-win98-grid">
            {FOUNDERS.map((founder) => {
              const role = t(founder.roleKey);
              return (
                <fieldset
                  key={founder.id}
                  className={`founders-win98-panel founders-win98-panel-${founder.id}`}
                >
                  <legend className="founders-win98-legend">{t(founder.nameKey)}</legend>
                  <div className="founders-win98-panel-inner">
                    <img
                      src={founder.image}
                      alt={t(founder.nameKey)}
                      className="founders-win98-avatar"
                    />
                    {role && <p className="founders-win98-role">{role}</p>}
                    <p className="founders-win98-bio">{t(founder.bioKey)}</p>
                  </div>
                </fieldset>
              );
            })}
          </div>
        </div>

        <div className="founders-win98-statusbar">
          <span className="founders-win98-status-text">{t("founders.tagline")}</span>
          <span className="founders-win98-status-grip" aria-hidden />
        </div>
      </div>
    </div>
  );
}
