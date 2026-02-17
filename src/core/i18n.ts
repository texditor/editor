import type { I18NInterface, TexditorInterface } from '@/types'
import { EnLocale } from "@/locales";

export default class I18N implements I18NInterface {
  private editor: TexditorInterface;
  private locale: string;
  private defaultLocale: string;
  private translations: Record<string, Record<string, string>> = {};

  constructor(editor: TexditorInterface) {
    this.editor = editor;
    this.defaultLocale = this.editor.config.get("defaultLocale", "en") as string;
    this.locale = this.editor.config.get("locale", this.defaultLocale) as string;
    this.setLocale("en", EnLocale);
  }

  getLocale(): string {
    return this.locale || "en";
  }

  getDefaultLocale(): string {
    return this.defaultLocale || "en";
  }

  setLocale(localeName: string, data: Record<string, string>): void {
    this.translations[localeName] = data;
  }

  addTranslations(localeName: string, data: Record<string, string>): void {
    this.translations[localeName] = Object.assign(this.translations[localeName], data);
  }

  get(key: string, def: string = ""): string {
    const locale = this.getLocale(),
      defaultLocale = this.getDefaultLocale();

    if (this.translations[locale]) {
      return this.translations[locale][key] || this.translations[defaultLocale][key] || def || "";
    }

    return this.translations[defaultLocale][key] || def || "";
  }
}
