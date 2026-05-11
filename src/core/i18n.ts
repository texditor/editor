import type { I18N, Texditor } from "@/types";
import { EnLocale } from "@/locales";

export default class I18N  {
  /** Reference to the editor instance */
  private editor: Texditor;
  /** Current active locale code */
  private locale: string = 'en';
  /** Default fallback locale code */
  private defaultLocale: string = 'en';
  /** Collection of translation dictionaries keyed by locale code */
  private translations: Record<string, Record<string, string>> = {};

  /**
   * Create a new i18n instance
   * @param editor - Editor instance reference
   */
  constructor(editor: Texditor) {
    this.editor = editor;
    const { config } = this.editor;
    this.defaultLocale = config.get("defaultLocale") || 'en';
    this.locale = config.get("locale", this.defaultLocale) || 'en';
    this.translations['en'] = EnLocale;

    const locales = config.get('locales');

    if (Array.isArray(locales)) {
      locales.forEach((item) => {
        if (item.code && item.data)
          this.translations[item.code] = item.data;
      });
    }
  }

  /**
   * Get current active locale
   * @returns Current locale code string
   */
  getLocale(): string {
    return this.locale;
  }

  /**
   * Get default fallback locale
   * @returns Default locale code string
   */
  getDefaultLocale(): string {
    return this.defaultLocale;
  }

  /**
   * Get translation for a key
   * @param key - Translation key to look up
   * @param def - Default value if translation not found
   * @returns Translated string or default value
   */
  get(key: string, def: string = ""): string {
    const locale = this.getLocale(),
      defaultLocale = this.getDefaultLocale();

    if (this.translations[locale]) {
      return (
        this.translations[locale][key] ||
        this.translations[defaultLocale][key] ||
        def ||
        ""
      );
    }

    return this.translations[defaultLocale][key] || def || "";
  }
}