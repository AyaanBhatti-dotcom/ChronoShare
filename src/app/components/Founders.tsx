import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Crown, Sparkles, Sun } from "lucide-react";

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
      <article className="founders-sheet">
        <section className="founders-hero" aria-labelledby="founders-heading">
          <div className="founders-hero-orb founders-hero-orb-a" aria-hidden />
          <div className="founders-hero-orb founders-hero-orb-b" aria-hidden />
          <div className="founders-hero-orb founders-hero-orb-c" aria-hidden />

          <div className="founders-hero-content">
            <span className="founders-eyebrow">
              <Sun size={13} className="founders-eyebrow-icon" />
              {t("founders.eyebrow")}
            </span>

            <div className="founders-crown-ring" aria-hidden>
              <Crown size={22} strokeWidth={1.75} />
            </div>

            <h2 id="founders-heading" className="founders-title">
              {t("founders.title")}
            </h2>
            <p className="founders-subtitle">{t("founders.subtitle")}</p>

            <p className="founders-tagline">
              <Sparkles size={14} />
              {t("founders.tagline")}
            </p>
          </div>

          <Crown
            size={140}
            strokeWidth={1}
            className="founders-hero-watermark"
            aria-hidden
          />
        </section>

        <FoundersWaveDivider />

        <div className="founders-grid">
          {FOUNDERS.map((founder, index) => {
            const role = t(founder.roleKey);
            return (
              <article
                key={founder.id}
                className={`founders-card founders-card-${founder.id} ${
                  index % 2 === 1 ? "founders-card-reverse" : ""
                }`}
              >
                <span className="founders-card-index" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="founders-avatar-wrap">
                  <img
                    src={founder.image}
                    alt={t(founder.nameKey)}
                    className="founders-avatar"
                  />
                </div>

                <div className="founders-card-body">
                  <h3 className="founders-name">
                    <Sparkles size={15} className="founders-name-icon" />
                    {t(founder.nameKey)}
                  </h3>
                  {role && <p className="founders-role">{role}</p>}
                  <p className="founders-bio">{t(founder.bioKey)}</p>
                </div>
              </article>
            );
          })}
        </div>

        <footer className="founders-footer">
          <Sparkles size={16} />
          <span>{t("founders.footer")}</span>
        </footer>
      </article>
    </div>
  );
}

function FoundersWaveDivider() {
  const gradientId = useId();

  return (
    <div className="founders-wave-divider" aria-hidden="true">
      <svg viewBox="0 0 1200 32" preserveAspectRatio="none" className="founders-wave-svg">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0)" />
            <stop offset="30%" stopColor="rgba(251,191,36,0.45)" />
            <stop offset="55%" stopColor="rgba(45,212,191,0.4)" />
            <stop offset="80%" stopColor="rgba(134,239,172,0.35)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,16 Q200,4 400,16 T800,16 T1200,16 L1200,32 L0,32 Z"
          fill={`url(#${gradientId})`}
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
