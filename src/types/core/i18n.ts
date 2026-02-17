export interface I18NInterface {
  // Locale management methods
  getLocale(): string;
  getDefaultLocale(): string;
  setLocale(localeName: string, data: Record<string, string>): void;
  addTranslations(localeName: string, data: Record<string, string>): void;

  // Translation method
  get(key: string, def?: string): string;
}
