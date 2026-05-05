import { readMessageFromErrorData } from '@/src/api/response';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readNestedDataMessage(err: unknown): string | undefined {
  const r = asRecord(err);
  if (r === null) return undefined;
  const fromParsed = readMessageFromErrorData(r.data);
  if (fromParsed !== undefined) return fromParsed;
  return undefined;
}

/** Some error shapes expose `detail` next to `data` (e.g. serialized API errors). */
function readTopLevelDetailMessage(err: unknown): string | undefined {
  const r = asRecord(err);
  if (r === null) return undefined;
  return readMessageFromErrorData(r);
}

function readTopLevelMessage(err: unknown): string | undefined {
  const r = asRecord(err);
  if (r === null) return undefined;
  const m = r.message;
  return typeof m === 'string' && m.trim().length > 0 ? m : undefined;
}

/** Extract a user-facing message from RTK Query errors, `ApiError`, or similar shapes. */
export function messageFromUnknownError(err: unknown, fallback: string): string {
  return readNestedDataMessage(err) ?? readTopLevelDetailMessage(err) ?? readTopLevelMessage(err) ?? fallback;
}

function codeFromErrorData(err: unknown): string | undefined {
  const r = asRecord(err);
  if (r === null) return undefined;
  const data = r.data;
  const d = asRecord(data);
  if (d === null) return undefined;
  if (typeof d.code === 'string' && d.code.length > 0) {
    return d.code;
  }
  const detail = d.detail;
  const det = asRecord(detail);
  if (det !== null && typeof det.code === 'string' && det.code.length > 0) {
    return det.code;
  }
  return undefined;
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
