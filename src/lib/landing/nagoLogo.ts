import type { BrandPublic } from "@/lib/brand/server";

/** Official Capoeira Nagô mark the school provided. Do not redraw. */
export const NAGO_BUNDLED_LOGO = "/images/nago/logo/logo.png";

/**
 * Public Nagô chrome always uses the bundled mark so a Storage/theme fallback
 * (generic `/images/logo.png` or an older upload) cannot replace it.
 */
export function resolveNagoLogo(_brand?: Pick<BrandPublic, "logoPath">): string {
  return NAGO_BUNDLED_LOGO;
}
