import type { MetadataRoute } from "next";
import { getRequestPublicSiteUrl } from "@/lib/site/requestPublicUrl";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getRequestPublicSiteUrl();
  const sitemap = base ? new URL("/sitemap.xml", base).toString() : undefined;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/blog/preview/", "/blog/vista-previa/"],
    },
    sitemap,
    host: base?.host,
  };
}
