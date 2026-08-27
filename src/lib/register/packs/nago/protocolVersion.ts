export const NAGO_PROTOCOL_VERSION = "2026-08";
export const NAGO_EXTRAS_SCHEMA_VERSION = 1;

export const NAGO_PROTOCOL_SECTION_IDS = [
  "inscription",
  "tuition",
  "attendance",
  "freeze",
  "events",
  "conduct",
  "health",
  "communication",
  "termination",
  "attire",
  "hygiene",
  "declaration",
] as const;

export type NagoProtocolSectionId = (typeof NAGO_PROTOCOL_SECTION_IDS)[number];
