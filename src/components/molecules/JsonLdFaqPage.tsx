import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import { buildFaqPageJsonLd } from "@/lib/public/instituteAnswerPages";

interface JsonLdFaqPageProps {
  items: readonly Pick<InstituteAnswerItem, "q" | "a">[];
}

/** Schema.org FAQPage for the public answer page. */
export function JsonLdFaqPage({ items }: JsonLdFaqPageProps) {
  if (items.length === 0) return null;
  const payload = buildFaqPageJsonLd(items);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
