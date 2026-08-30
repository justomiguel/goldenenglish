/** Bump when the public privacy page copy changes in a material way. */
export const PRIVACY_POLICY_VERSION = "2026-08-29";

export type PrivacyAcceptanceStamp = {
  privacy_accepted_at: string;
  privacy_policy_version: string;
};

export function privacyAcceptanceStamp(now = new Date()): PrivacyAcceptanceStamp {
  return {
    privacy_accepted_at: now.toISOString(),
    privacy_policy_version: PRIVACY_POLICY_VERSION,
  };
}
