import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();
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
