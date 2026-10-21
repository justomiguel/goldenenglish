function firstUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Page photo, then home photo, then logo. */
export function pickShareImageUrl(
  pageImage: string | null | undefined,
  homeImage: string | null | undefined,
  logoImage: string | null | undefined,
): string | null {
  return firstUrl(pageImage) ?? firstUrl(homeImage) ?? firstUrl(logoImage);
}
