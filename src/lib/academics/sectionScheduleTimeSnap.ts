const DEFAULT_STEP_MINUTES = 15;

/** Rounds minutes to the nearest step boundary (default 15). */
export function snapMinutesToStep(
  minutes: number,
  stepMinutes: number = DEFAULT_STEP_MINUTES,
): number {
  if (stepMinutes <= 0) return minutes;
  return Math.round(minutes / stepMinutes) * stepMinutes;
}

/** Formats minutes-from-midnight as zero-padded "HH:MM". */
export function minutesToHhMm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
