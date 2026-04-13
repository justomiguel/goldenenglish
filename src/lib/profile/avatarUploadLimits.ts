/** App-side max for profile avatar uploads (must stay ≤ platform body limits where deployed). */
export const PROFILE_AVATAR_MAX_BYTES = 15 * 1024 * 1024;

export function profileAvatarMaxSizeMb(): number {
  return Math.floor(PROFILE_AVATAR_MAX_BYTES / (1024 * 1024));
}

/** Replace `{max}` in dictionary strings with the configured max size in MB. */
export function fillProfileAvatarMaxMbTemplate(s: string): string {
  return s.replaceAll("{max}", String(profileAvatarMaxSizeMb()));
}
