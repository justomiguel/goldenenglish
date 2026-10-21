import { notFound, permanentRedirect } from "next/navigation";
import { loadShopOrderByPayToken } from "@/lib/shop/loadShopOrderByPayToken";
import { buildShopOrderPath } from "@/lib/site/publicSharePaths";

export const dynamic = "force-dynamic";

/** One segment is the old pay token. The slot name stays `slug` for the two-segment route. */
export default async function LegacyShopOrderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug: token } = await params;
  const order = await loadShopOrderByPayToken(token);
  if (!order) notFound();
  permanentRedirect(buildShopOrderPath(locale, order.items[0]?.title ?? "", token));
}
