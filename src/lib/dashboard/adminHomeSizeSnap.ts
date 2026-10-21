import {
  adminHomeColumns,
  adminHomeSizeAllowed,
  clampAdminHomeSize,
  type AdminHomeCardSize,
  type AdminHomeWidgetId,
} from "@/lib/dashboard/adminHomeLayout";

const ORDER: AdminHomeCardSize[] = ["s", "m", "l", "full"];

function allowedSizes(id: AdminHomeWidgetId): AdminHomeCardSize[] {
  return ORDER.filter((size) => adminHomeSizeAllowed(id, size));
}

export function adminHomeSizeFromWidth(
  id: AdminHomeWidgetId,
  widthPx: number,
  gridWidthPx: number,
): AdminHomeCardSize {
  const allowed = allowedSizes(id);
  const fallback = allowed[0] ?? "s";
  if (gridWidthPx <= 0) return fallback;
  const columns = (widthPx / gridWidthPx) * 12;
  let best = fallback;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const size of allowed) {
    const dist = Math.abs(adminHomeColumns(size) - columns);
    const closer = dist < bestDist;
    const tieToLarger = dist === bestDist && ORDER.indexOf(size) > ORDER.indexOf(best);
    if (closer || tieToLarger) {
      best = size;
      bestDist = dist;
    }
  }
  return best;
}

export function stepAdminHomeSize(
  id: AdminHomeWidgetId,
  current: AdminHomeCardSize,
  direction: -1 | 1,
): AdminHomeCardSize {
  const allowed = allowedSizes(id);
  const index = allowed.indexOf(clampAdminHomeSize(id, current));
  return allowed[index + direction] ?? allowed[Math.max(index, 0)] ?? "s";
}
