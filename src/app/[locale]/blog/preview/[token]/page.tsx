import { notFound, permanentRedirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verifyBlogPreviewToken } from "@/lib/blog/previewToken";
import { buildBlogPreviewPath } from "@/lib/site/publicSharePaths";

export const metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; token: string }>;
}

export default async function LegacyBlogPreviewPage({ params }: PageProps) {
  noStore();
  const { locale, token } = await params;
  const payload = verifyBlogPreviewToken(token);
  if (!payload) notFound();
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_article_translations")
    .select("slug")
    .eq("article_id", payload.articleId)
    .eq("locale", locale)
    .maybeSingle();
  const slug = data?.slug ? String(data.slug) : "articulo";
  permanentRedirect(buildBlogPreviewPath(locale, slug, token));
}
