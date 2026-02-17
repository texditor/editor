export function isEmptyString(string: string): boolean {
  return !string.replace(
    /[\s\u200B\uFEFF\u00A0\u1680\u180E\u2000-\u200F\u2028-\u202F\u205F\u3000]+/g,
    ""
  );
}

export function capitalize(string: string): string {
  return String(string[0]).toUpperCase() + String(string).slice(1);
}

export function replacement(
  find: string,
  replace: string,
  string: string
): string {
  return string.split(find).join(replace);
}
