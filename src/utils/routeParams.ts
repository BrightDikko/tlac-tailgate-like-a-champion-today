/** Normalize Expo Router search param (string | string[] | undefined) to a single string. */
export function paramOne(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
