export function generateRandomString(length: number): string {
  let result = "";

  const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function detectMobileOS():
  | "android"
  | "ios"
  | "windows_phone"
  | "other" {
  const ua = navigator.userAgent.toLowerCase();

  if (/android/.test(ua) && !/chrome os|cros/.test(ua)) return "android";

  // Обновленная проверка для iOS
  if (
    /ipad|iphone|ipod/.test(ua) ||
    (/mac/.test(ua) && navigator.maxTouchPoints > 1)
  )
    return "ios";

  if (/windows phone|iemobile|edge mobile/.test(ua)) return "windows_phone";

  return "other";
}

export function getCaretPosition(
  event?: PointerEvent | TouchEvent
): { x: number; y: number } | null {
  if (event) {
    const clientX =
      "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY =
      "touches" in event ? event.touches[0].clientY : event.clientY;
    return { x: clientX, y: clientY };
  }

  const selectionRect = getSelectionRect();
  if (selectionRect) {
    return { x: selectionRect.left, y: selectionRect.bottom };
  }

  return null;
}

export function getSelectionRect() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  return range.getBoundingClientRect();
}

export function decodeHtmlSpecialChars(input: string): string {
  const entities: { [key: string]: string } = {
    "&amp;": "&",
    "&quot;": '"',
    "&#039;": "'",
    "&lt;": "<",
    "&gt;": ">"
  };

  return input.replace(
    /&(amp|quot|#039|lt|gt);/g,
    (match) => entities[match] || match
  );
}

export function encodeHtmlSpecialChars(input: string): string {
  const charToEntity: { [key: string]: string } = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#039;",
    "<": "&lt;",
    ">": "&gt;"
  };

  return input.replace(/[&"'<>]/g, (char) => charToEntity[char]);
}

/**
 * Converts bytes to a human readable string with automatic browser locale detection
 * @param bytes - The number of bytes to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) {
    return new Intl.NumberFormat(navigator.language).format(0) + " B";
  }

  const k = 1024;
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const unitTranslations: Record<string, string[]> = {
    ru: ["Б", "КБ", "МБ", "ГБ", "ТБ", "ПБ", "ЭБ", "ЗБ", "ЙБ"],
    uk: ["Б", "КБ", "МБ", "ГБ", "ТБ", "ПБ", "ЕБ", "ЗБ", "ЙБ"],
    de: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    fr: ["o", "Ko", "Mo", "Go", "To", "Po", "Eo", "Zo", "Yo"],
    es: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    it: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    pl: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    zh: ["字节", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    ja: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    ko: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    ar: ["ب", "ك ب", "م ب", "ج ب", "ت ب", "ب ب", "ا ب", "ز ب", "ي ب"],
    hi: ["बाइट", "कीबी", "मीबी", "गीबी", "तीबी", "पीबी", "ईबी", "जीबी", "यीबी"]
  };

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  const formattedValue = new Intl.NumberFormat(navigator.language, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);

  const langCode = navigator.language.split("-")[0];
  const localizedUnits = unitTranslations[langCode] || units;

  return `${formattedValue} ${localizedUnits[i]}`;
}
