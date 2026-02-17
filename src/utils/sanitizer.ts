/**
 * Sanitizes JSON by removing or escaping control characters and Unicode formatting marks
 *
 * @param json - Input JSON as string or object
 * @returns Sanitized JSON string or null if parsing fails
 */
export function sanitizeJson(json: string | object): string | null {
  const jsonString = typeof json === "string" ? json : JSON.stringify(json);

  // Create control characters regex dynamically
  const controlCharsRegex = new RegExp(
    "[" +
      String.fromCharCode(0x0000) +
      "-" +
      String.fromCharCode(0x001f) +
      String.fromCharCode(0x007f) +
      "]",
    "g"
  );

  // First pass: remove control characters except tab, newline, and carriage return
  let cleaned = jsonString.replace(controlCharsRegex, (match) => {
    const code = match.charCodeAt(0);
    return code === 9 || code === 10 || code === 13 ? match : "";
  });

  // Remove various Unicode control characters
  const unicodeControlRegex = new RegExp(
    "[" +
      String.fromCharCode(0x200b) +
      "-" +
      String.fromCharCode(0x200f) +
      String.fromCharCode(0x2028) +
      "-" +
      String.fromCharCode(0x202f) +
      String.fromCharCode(0x205f) +
      "-" +
      String.fromCharCode(0x206f) +
      String.fromCharCode(0xfeff) +
      String.fromCharCode(0x2066) +
      "-" +
      String.fromCharCode(0x2069) +
      "]",
    "g"
  );

  cleaned = cleaned.replace(unicodeControlRegex, "");

  // Second pass: escape remaining control characters
  cleaned = cleaned.replace(
    controlCharsRegex,
    (match) => "\\u" + match.charCodeAt(0).toString(16).padStart(4, "0")
  );

  try {
    return JSON.stringify(JSON.parse(cleaned));
  } catch {
    // Final cleanup: remove non-printable characters
    const nonPrintableRegex = new RegExp(
      "[^" +
        String.fromCharCode(0x0020) +
        "-" +
        String.fromCharCode(0x007e) +
        String.fromCharCode(0x0009) + // tab
        String.fromCharCode(0x000a) + // newline
        String.fromCharCode(0x000d) + // carriage return
        "]",
      "g"
    );

    const finalCleaned = cleaned.replace(nonPrintableRegex, "");
    try {
      return JSON.stringify(JSON.parse(finalCleaned));
    } catch {
      return null;
    }
  }
}
