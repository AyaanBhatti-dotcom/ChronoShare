import { useTranslation } from "react-i18next";
import { Crown, Sparkles } from "lucide-react";

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
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <section className="dash-card dash-card-hero p-6 sm:p-8 text-center">
        <div className="dash-icon-box w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown size={20} className="dash-accent" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg sm:text-xl font-bold dash-heading">{t("founders.title")}</h2>
        <p className="text-sm dash-subtext mt-2 max-w-md mx-auto leading-relaxed">
          {t("founders.subtitle")}
        </p>
      </section>

      <div className="space-y-5">
        {FOUNDERS.map((founder) => (
          <article key={founder.id} className="dash-card dash-card-hover overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6">
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <img
                  src={founder.image}
                  alt={t(founder.nameKey)}
                  className="w-36 h-36 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-md ring-2 ring-white/60"
                />
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <Sparkles size={14} className="dash-accent flex-shrink-0" />
                  <h3 className="text-base font-bold dash-heading">{t(founder.nameKey)}</h3>
                </div>
                {t(founder.roleKey) && (
                  <p className="text-xs font-medium dash-accent mb-3">{t(founder.roleKey)}</p>
                )}
                <p className="text-sm dash-subtext leading-relaxed">{t(founder.bioKey)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
