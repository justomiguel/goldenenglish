interface JsonLdArticleProps {
  url: string;
  title: string;
  description: string;
  publishedAt: string;
  authorName?: string;
  imageUrl?: string | null;
}

export function JsonLdArticle({
  url,
  title,
  description,
  publishedAt,
  authorName,
  imageUrl,
}: JsonLdArticleProps) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    mainEntityOfPage: url,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(authorName ? { author: { "@type": "Person", name: authorName } } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
