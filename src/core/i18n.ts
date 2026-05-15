import type {
  I18N as II18N,
  LocaleMapData,
  Texditor
} from "@/types";
import { EnLocale } from "@/locales";

export default class I18N implements II18N {
  /** Reference to the editor instance */
  private editor: Texditor;

  /** Current active locale code */
  private locale: string = 'en';

  /** Default fallback locale code */
  private defaultLocale: string = 'en';
  
  /** Collection of translation dictionaries keyed by locale code */
  private translations: LocaleMapData = {} as LocaleMapData;

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
   * @see II18N.getLocale
   */
  getLocale(): string {
    return this.locale;
  }

  /**
   * @see II18N.getDefaultLocale
   */
  getDefaultLocale(): string {
    return this.defaultLocale;
  }

  /**
   * @see II18N.get
   */
  get(key: string, def: string = ""): string {
    const locale = this.getLocale(),
      defaultLocale = this.getDefaultLocale();

    const tLocale = this.translations[locale] as Record<string, string> | undefined,
      tDefaultLocale = this.translations[defaultLocale] as Record<string, string> | undefined;

    if (tLocale)
      return (tLocale[key] || tDefaultLocale?.[key] || def || "");

    return tDefaultLocale?.[key] || def || "";
  }
}