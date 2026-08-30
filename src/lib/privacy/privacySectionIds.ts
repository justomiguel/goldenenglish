export const PRIVACY_SECTION_IDS = [
  "promise",
  "controller",
  "what",
  "why",
  "who",
  "security",
  "retention",
  "rights",
  "terms",
] as const;

export type PrivacySectionId = (typeof PRIVACY_SECTION_IDS)[number];
