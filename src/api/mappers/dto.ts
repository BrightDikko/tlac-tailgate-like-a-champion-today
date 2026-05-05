/** Narrow unknown JSON-ish values to a plain object. */
export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function pickId(obj: Record<string, unknown>): string | undefined {
  const id = obj.id ?? obj._id;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

export function pickString(obj: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string') return v;
  }
  return fallback;
}

export function pickOptionalString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return undefined;
}

export function pickNumber(obj: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number.parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

export function pickBoolean(obj: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'boolean') return v;
  }
  return undefined;
}

export function pickStringArray(obj: Record<string, unknown>, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      return v as string[];
    }
  }
  return undefined;
}
