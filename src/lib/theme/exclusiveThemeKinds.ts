import { SITE_THEME_KINDS, type SiteThemeKind } from "@/types/theming";

/** Shared shells. Any institute may select them. */
export const SHARED_THEME_KINDS = ["classic", "editorial", "minimal"] as const;

/**
 * Bespoke landings. The value is the owner tenant slug from the deploy registry.
 * A new client landing adds a row here and stays out of GENERIC_INSTITUTE_KINDS.
 */
export const EXCLUSIVE_THEME_OWNERS: Readonly<
  Partial<Record<SiteThemeKind, readonly string[]>>
> = {
  mozarthitos: ["mozarthitos"],
  espaciozenit: ["espaciozenit"],
  nago: ["nago"],
  mimundo: ["mimundo"],
  liora: ["liora"],
  matiss: ["matiss"],
};

export function isExclusiveThemeKind(kind: string | null | undefined): boolean {
  if (!kind) return false;
  return Object.prototype.hasOwnProperty.call(EXCLUSIVE_THEME_OWNERS, kind);
}

/** Catalog and shared kinds are open. An exclusive kind needs its owner. No tenant means a single-client database. */
export function canTenantUseThemeKind(
  kind: string,
  tenantSlug: string | null,
): boolean {
  if (!isExclusiveThemeKind(kind)) return true;
  if (tenantSlug === null) return true;
  const owners = EXCLUSIVE_THEME_OWNERS[kind as SiteThemeKind];
  return owners?.includes(tenantSlug) ?? false;
}

/** Kinds the CMS picker may show. The active kind stays even when this tenant does not own it. */
export function themeKindsForTenant(
  tenantSlug: string | null,
  currentKind: SiteThemeKind,
): SiteThemeKind[] {
  const allowed = SITE_THEME_KINDS.filter((kind) =>
    canTenantUseThemeKind(kind, tenantSlug),
  );
  if (allowed.includes(currentKind)) return allowed;
  return [currentKind, ...allowed];
}
