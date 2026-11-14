import type { BrandPublic } from "@/lib/brand/server";

/** Official Capoeira Nagô mark the school provided. Do not redraw. */
export const NAGO_BUNDLED_LOGO = "/images/nago/logo/logo.png";

/** Landing sections use the bundled mark until that client moves into its own variant. */
export function resolveNagoLogo(_brand?: Pick<BrandPublic, "logoPath">): string {
  return NAGO_BUNDLED_LOGO;
}
