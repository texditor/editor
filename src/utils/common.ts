/**
 * Detects the mobile operating system from user agent
 * @returns Detected OS: 'android', 'ios', 'windows_phone', or 'other'
 */
export function detectMobileOS():
  | "android"
  | "ios"
  | "windows_phone"
  | "other" {
  const ua = navigator.userAgent.toLowerCase();

  if (/android/.test(ua) && !/chrome os|cros/.test(ua)) return "android";

  if (
    /ipad|iphone|ipod/.test(ua) ||
    (/mac/.test(ua) && navigator.maxTouchPoints > 1)
  )
    return "ios";

  if (/windows phone|iemobile|edge mobile/.test(ua)) return "windows_phone";

  return "other";
}

/**
 * Gets the cursor or touch position coordinates
 * @param event - Pointer or Touch event (optional)
 * @returns Coordinates object with x and y, or null if not available
 */
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

/**
 * Gets the bounding rectangle of the current text selection
 * @returns DOMRect of the selection, or null if no selection exists
 */
export function getSelectionRect() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  return range.getBoundingClientRect();
}

/**
 * Executes a class method if it exists on the given instance
 * @param instance - The class instance containing the method to execute
 * @param methodName - The name of the method to look up and execute
 * @param args - An array of arguments to pass to the method (default: [])
 * @returns The return value of the executed method, or null if the method doesn't exist or is not callable
 */
export function executeMethodIfExists<
  T extends object,
  R = unknown,
  Args extends unknown[] = unknown[]
>(
  instance: T,
  methodName: string,
  args: Args = [] as unknown as Args
): R | null {
  const method = (instance as T)[methodName as keyof T];

  if (typeof method === 'function') {
    return (method as (...args: Args) => R).apply(instance, args);
  }

  return null;
}