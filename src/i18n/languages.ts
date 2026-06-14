export interface Language {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

/** Top languages worldwide by total speakers (native + second language). */
export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "中文", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
];

export const DEFAULT_LANGUAGE = "en";

export function getLanguage(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function usesMetricDistance(code: string): boolean {
  return code !== "en";
}
