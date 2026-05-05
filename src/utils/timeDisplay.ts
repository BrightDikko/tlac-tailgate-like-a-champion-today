export function formatClockTime(iso?: string): string {
  if (iso === undefined || iso.trim() === '') return 'Not set';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDurationMinutes(minutes?: number | null): string {
  if (minutes === undefined || minutes === null || !Number.isFinite(minutes) || minutes < 0) {
    return 'Not set';
  }
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;
  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

export function minutesUntil(iso?: string): number | null {
  if (iso === undefined || iso.trim() === '') return null;
  const expiresMs = Date.parse(iso);
  if (!Number.isFinite(expiresMs)) return null;
  return Math.max(0, Math.ceil((expiresMs - Date.now()) / 60000));
}

export function formatCountdown(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds)) {
    return 'Pickup deadline unavailable';
  }
  const seconds = Math.max(0, Math.floor(totalSeconds));
  if (seconds <= 0) return 'Ending now';
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${String(remainingSeconds).padStart(2, '0')} sec`;
  }
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  return `${hours} hr ${String(remainingMinutes).padStart(2, '0')} min`;
}
