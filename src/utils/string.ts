/**
 * Checks if a string is empty or contains only whitespace and invisible characters
 * @param string - The string to check
 * @returns True if the string is empty or contains only whitespace/invisible characters
 */
export function isEmptyString(string: string): boolean {
  return !string.replace(
    /[\s\u200B\uFEFF\u00A0\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F\u3000]+/g,
    ""
  );
}

/**
 * Capitalizes the first character of a string
 * @param string - The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(string: string): string {
  return String(string[0]).toUpperCase() + String(string).slice(1);
}

/**
 * Replaces all occurrences of a substring within a string
 * @param find - The substring to find
 * @param replace - The replacement string
 * @param string - The original string
 * @returns The string with all occurrences replaced
 */
export function replacement(
  find: string,
  replace: string,
  string: string
): string {
  return string.split(find).join(replace);
}