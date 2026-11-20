import { RichContentDisplay } from "@/components/organisms/RichContentDisplay";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

export const BLOG_ARTICLE_BODY_PROSE =
  "prose prose-neutral max-w-none text-[var(--color-foreground)] [&_p]:indent-8 [&_p]:text-justify [&_p]:leading-relaxed [&_p+p]:mt-4 [&_p:has(img)]:indent-0 [&_p:has(img)]:text-center [&_h2]:mt-8 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--color-primary)] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1.5 [&_a]:font-medium [&_a]:text-[var(--color-primary)] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_em]:italic [&_u]:underline [&_u]:underline-offset-2 [&_u]:decoration-[var(--color-primary)] [&_iframe]:hidden [&_img]:mx-auto [&_img]:my-6 [&_img]:block [&_img]:h-auto [&_img]:max-h-[min(70dvh,640px)] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)] [&_img]:object-contain [&_img]:object-center";

interface BlogArticleBodyHtmlProps {
  html: string;
  labels: RichContentDisplayLabels;
  className?: string;
}

export function BlogArticleBodyHtml({ html, labels, className }: BlogArticleBodyHtmlProps) {
  return (
    <RichContentDisplay
      html={html}
      labels={labels}
      className={className ?? "space-y-6"}
      proseClassName={BLOG_ARTICLE_BODY_PROSE}
    />
  );
}
