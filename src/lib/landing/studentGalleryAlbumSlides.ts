import type { Dictionary } from "@/types/i18n";

/**
 * Parses CSV-ish indices for the landing student gallery (0-based positions in
 * the modalidades media pool). Ignores out-of-range tokens.
 */
export function parseStudentGalleryPhotoIndexesList(
  raw: string | undefined,
  maxExclusive: number,
  fallback: readonly number[],
): number[] {
  const fromRaw = (): number[] => {
    if (raw == null || !String(raw).trim()) return [];
    const parts = String(raw).split(/[,;\s]+/u);
    const out: number[] = [];
    for (const p of parts) {
      const t = p.trim();
      if (!t) continue;
      const n = Number.parseInt(t, 10);
      if (!Number.isFinite(n) || n < 0 || n >= maxExclusive) continue;
      out.push(n);
    }
    return out;
  };

  const parsed = fromRaw();
  if (parsed.length > 0) return parsed;

  const fb = fallback.filter(
    (n) => Number.isFinite(n) && n >= 0 && n < maxExclusive,
  );
  if (fb.length > 0) return [...fb];
  return [0];
}

export function resolveStudentGalleryAlbumSlides(
  sg: Dictionary["landing"]["studentGallery"],
  albumIdx: number,
  poolSize: number,
): number[] {
  const item = sg.items[albumIdx];
  const fallback = item?.photoIndexes ?? [];
  const raw =
    albumIdx === 0
      ? sg.album1PhotoIndexes
      : albumIdx === 1
        ? sg.album2PhotoIndexes
        : undefined;
  return parseStudentGalleryPhotoIndexesList(raw, poolSize, fallback);
}
