/** Curated IANA zones for institute-wide scheduling (quiet hours, calendar). */
export const INSTITUTE_TIME_ZONE_IDS = [
  "America/Argentina/Cordoba",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Jujuy",
  "America/Argentina/Mendoza",
  "America/Asuncion",
] as const;

export type InstituteTimeZoneId = (typeof INSTITUTE_TIME_ZONE_IDS)[number];
