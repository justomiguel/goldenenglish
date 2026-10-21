function firstSectionUrl(
  media: ReadonlyMap<string, string> | null | undefined,
  section: string,
): string | null {
  if (!media) return null;
  let bestPos = Number.POSITIVE_INFINITY;
  let best: string | null = null;
  for (const [key, url] of media) {
    const splitAt = key.indexOf("::");
    if (splitAt < 0) continue;
    if (key.slice(0, splitAt) !== section) continue;
    const pos = Number(key.slice(splitAt + 2));
    const trimmed = url.trim();
    if (!Number.isFinite(pos) || pos < 1 || !trimmed) continue;
    if (pos < bestPos) {
      bestPos = pos;
      best = trimmed;
    }
  }
  return best;
}

/**
 * Home photo for share cards.
 * `inicio` is the hero. `modalidades` is the gallery.
 * Bundled paths are used only when the media map has no image.
 */
export function pickHomeSharePhotoUrl(input: {
  media: ReadonlyMap<string, string> | null | undefined;
  bundledInicio: string | null;
  bundledGallery: string | null;
}): string | null {
  const inicio = firstSectionUrl(input.media, "inicio");
  if (inicio) return inicio;
  const gallery = firstSectionUrl(input.media, "modalidades");
  if (gallery) return gallery;
  const bundledInicio = input.bundledInicio?.trim() ?? "";
  if (bundledInicio) return bundledInicio;
  const bundledGallery = input.bundledGallery?.trim() ?? "";
  return bundledGallery || null;
}
