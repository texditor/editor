export function generateRandomString(length: number): string {
  let result = "";

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function detectMobileOS(): "android" | "ios" | "windows_phone" | "other" {
  const ua = navigator.userAgent.toLowerCase();

  if (/android/.test(ua) && !/chrome os|cros/.test(ua)) return "android";
  if (/ipad|iphone|ipod/.test(ua) || (/mac/.test(navigator.platform.toLowerCase()) && navigator.maxTouchPoints > 1))
    return "ios";
  if (/windows phone|iemobile|edge mobile/.test(ua)) return "windows_phone";

  return "other";
}

export function getCaretPosition(event?: PointerEvent | TouchEvent): { x: number; y: number } | null {
  if (event) {
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;
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
