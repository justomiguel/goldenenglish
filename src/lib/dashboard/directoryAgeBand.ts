export const DIRECTORY_AGE_BANDS = [
  "unknown",
  "0-2",
  "3-5",
  "6-8",
  "9-12",
  "13-17",
  "18+",
] as const;

export type DirectoryAgeBand = (typeof DIRECTORY_AGE_BANDS)[number];

export function directoryAgeBand(ageYears: number | null): DirectoryAgeBand {
  if (ageYears == null || !Number.isFinite(ageYears) || ageYears < 0) return "unknown";
  if (ageYears <= 2) return "0-2";
  if (ageYears <= 5) return "3-5";
  if (ageYears <= 8) return "6-8";
  if (ageYears <= 12) return "9-12";
  if (ageYears <= 17) return "13-17";
  return "18+";
}
