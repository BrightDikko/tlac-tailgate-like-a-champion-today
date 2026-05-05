function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readNestedDataMessage(err: unknown): string | undefined {
  const r = asRecord(err);
  if (r === null) return undefined;
  const data = r.data;
  const d = asRecord(data);
  if (d === null) return undefined;
  const m = d.message;
  return typeof m === 'string' && m.trim().length > 0 ? m : undefined;
}

function readTopLevelMessage(err: unknown): string | undefined {
  const r = asRecord(err);
  if (r === null) return undefined;
  const m = r.message;
  return typeof m === 'string' && m.trim().length > 0 ? m : undefined;
}

/** Extract a user-facing message from RTK Query errors, `ApiError`, or similar shapes. */
export function messageFromUnknownError(err: unknown, fallback: string): string {
  return readNestedDataMessage(err) ?? readTopLevelMessage(err) ?? fallback;
}

function codeFromErrorData(err: unknown): string | undefined {
  const r = asRecord(err);
  if (r === null) return undefined;
  const data = r.data;
  const d = asRecord(data);
  if (d === null) return undefined;
  const c = d.code;
  return typeof c === 'string' ? c : undefined;
}

function messageLooksNotFound(text: string): boolean {
  return text.toLowerCase().includes('not found');
}

/** Best-effort detection of missing-entity / 404 style errors for UI branching. */
export function isNotFoundError(err: unknown): boolean {
  if (codeFromErrorData(err) === 'NOT_FOUND') {
    return true;
  }
  const nested = readNestedDataMessage(err);
  if (nested !== undefined && messageLooksNotFound(nested)) {
    return true;
  }
  const top = readTopLevelMessage(err);
  if (top !== undefined && messageLooksNotFound(top)) {
    return true;
  }
  const r = asRecord(err);
  if (r === null) return false;
  const st = r.status;
  if (st === 404 || st === '404' || st === 'NOT_FOUND') {
    return true;
  }
  return false;
}
