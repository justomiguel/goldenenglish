import { createClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";
import { loadPublishedArticles } from "@/lib/blog/server";

interface RouteContext {
  params: Promise<{ locale: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { locale } = await context.params;
  const supabase = await createClient();
  const publicUrl = getPublicSiteUrl();
  const feed = await loadPublishedArticles(supabase, {
    locale: locale as "en" | "es" | "pt",
    page: 1,
    pageSize: 50,
  });

  const items = feed.rows
    .filter((row) => row.translation)
    .map((row) => {
      const translation = row.translation!;
      const link = `${publicUrl}/${locale}/blog/${translation.slug}`;
      return `
        <item>
          <title><![CDATA[${translation.title}]]></title>
          <link>${link}</link>
          <guid>${link}</guid>
          <description><![CDATA[${translation.excerpt}]]></description>
          <pubDate>${new Date(row.publishedAt ?? row.createdAt).toUTCString()}</pubDate>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog</title>
    <link>${publicUrl}/${locale}/blog</link>
    <description>Blog feed</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
