export function registrationTelHref(display: string | null | undefined): string | null {
  const compact = (display ?? "").replace(/[^\d+]/g, "");
  if (!/\d/.test(compact)) return null;
  return `tel:${compact}`;
}
