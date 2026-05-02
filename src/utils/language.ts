export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "pl", label: "Polski" },
  { code: "cs", label: "Čeština" },
  { code: "hu", label: "Magyar" },
  { code: "ro", label: "Română" },
  { code: "sk", label: "Slovenčina" },
  { code: "tr", label: "Türkçe" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const API_LANGUAGE_STORAGE_KEY = "taskTracker_api_language_v1";

const SUPPORTED_LANGUAGE_CODES = new Set<string>(
  SUPPORTED_LANGUAGES.map((language) => language.code),
);

export function normalizeLanguage(value: unknown): LanguageCode {
  return typeof value === "string" && SUPPORTED_LANGUAGE_CODES.has(value)
    ? (value as LanguageCode)
    : DEFAULT_LANGUAGE;
}
