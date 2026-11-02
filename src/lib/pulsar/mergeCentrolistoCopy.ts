function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Overlay wins. `null` inside an array keeps the base item at that index. */
export function mergeCentrolistoCopy<T>(base: T, overlay: unknown): T {
  if (overlay === null || overlay === undefined) return base;
  if (Array.isArray(base) && Array.isArray(overlay)) {
    const length = Math.max(base.length, overlay.length);
    const next: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const item = overlay[index];
      if (index >= overlay.length || item === null || item === undefined) {
        next.push(base[index]);
      } else if (index >= base.length) {
        next.push(item);
      } else {
        next.push(mergeCentrolistoCopy(base[index], item));
      }
    }
    return next as T;
  }
  if (isPlainObject(base) && isPlainObject(overlay)) {
    const next: Record<string, unknown> = { ...base };
    for (const key of Object.keys(overlay)) {
      next[key] = mergeCentrolistoCopy(base[key], overlay[key]);
    }
    return next as T;
  }
  return overlay as T;
}
