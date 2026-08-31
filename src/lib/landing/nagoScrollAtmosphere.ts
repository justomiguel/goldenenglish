export function nagoPageProgress(scrollY: number, maxScroll: number): number {
  if (maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / maxScroll));
}

export function nagoDriftOffset(
  elementCenterY: number,
  viewportCenterY: number,
  strength: number,
): number {
  return ((viewportCenterY - elementCenterY) * strength) / 420;
}

export function applyNagoScrollAtmosphere(input: {
  landing: HTMLElement;
  drifts: Iterable<HTMLElement>;
  scrollY: number;
  maxScroll: number;
  viewportHeight: number;
}): void {
  const progress = nagoPageProgress(input.scrollY, input.maxScroll);
  input.landing.style.setProperty("--nago-page-progress", String(progress));
  const mid = input.viewportHeight / 2;
  for (const el of input.drifts) {
    const strength = Number(el.dataset.nagoDrift);
    if (!Number.isFinite(strength) || strength === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -120 || rect.top > input.viewportHeight + 120) continue;
    const y = nagoDriftOffset(rect.top + rect.height / 2, mid, strength);
    el.style.setProperty("--nago-drift", y.toFixed(2));
  }
}
