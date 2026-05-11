/**
 * Locale map data structure
 * Key-value pairs for translation strings
 */
export type LocaleMapData = {
  [key: string]: unknown
}

/**
 * Locale map interface
 * @property code - Locale identifier code
 * @property data - Translation data for the locale
 */
export interface LocaleMap {
  code: string,
  data: LocaleMapData;
}

/**
 * I18N interface for internationalization management
 * Defines all public methods for translation handling
 */
export interface I18N {
  /**
   * Get current active locale
   * @returns Current locale code string
   */
  getLocale(): string;

  /**
   * Get default fallback locale
   * @returns Default locale code string
   */
  getDefaultLocale(): string;

  /**
   * Get translation for a key
   * @param key - Translation key to look up
   * @param def - Default value if translation not found
   * @returns Translated string or default value
   */
  get(key: string, def?: string): string;
}