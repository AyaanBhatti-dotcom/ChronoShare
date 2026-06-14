import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { getLanguage, DEFAULT_LANGUAGE } from "./languages";

import en from "./locales/en.json";
import zh from "./locales/zh.json";
import hi from "./locales/hi.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";
import pt from "./locales/pt.json";
import fr from "./locales/fr.json";
import bn from "./locales/bn.json";
import ru from "./locales/ru.json";
import ja from "./locales/ja.json";
import de from "./locales/de.json";

function applyDocumentLanguage(lng: string) {
  const lang = getLanguage(lng.split("-")[0]);
  document.documentElement.lang = lang.code;
  document.documentElement.dir = lang.dir;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
      hi: { translation: hi },
      es: { translation: es },
      ar: { translation: ar },
      pt: { translation: pt },
      fr: { translation: fr },
      bn: { translation: bn },
      ru: { translation: ru },
      ja: { translation: ja },
      de: { translation: de },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ["en", "zh", "hi", "es", "ar", "pt", "fr", "bn", "ru", "ja", "de"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "chronoshare-lang",
    },
  });

applyDocumentLanguage(i18n.language);
i18n.on("languageChanged", applyDocumentLanguage);

export default i18n;
