import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/dictionaries";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";
import { isPulsarCrawlHost } from "@/lib/tenant/tenantRegistry";

export const dynamic = "force-dynamic";

const PREVIEW_PATHS = ["/blog/preview/", "/blog/vista-previa/"];

function pulsarPrivatePaths(): string[] {
  const paths = [...PREVIEW_PATHS];
  for (const locale of locales) {
    paths.push(`/${locale}/admin`, `/${locale}/dashboard`);
  }
  return paths;
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getRequestPublicSiteUrl();
  const sitemap = base ? new URL("/sitemap.xml", base).toString() : undefined;
  const pulsar = base ? isPulsarCrawlHost(base.host) : false;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: pulsar ? pulsarPrivatePaths() : PREVIEW_PATHS,
    },
    sitemap,
    host: base?.host,
  };
}
