import { RichContentDisplay } from "@/components/organisms/RichContentDisplay";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

export const BLOG_ARTICLE_BODY_PROSE =
  "prose prose-neutral max-w-none text-[var(--color-foreground)] [&_p]:indent-8 [&_p]:text-justify [&_p]:leading-relaxed [&_p+p]:mt-4 [&_a]:font-medium [&_a]:text-[var(--color-primary)] [&_a]:underline [&_a]:underline-offset-2 [&_iframe]:hidden [&_img]:my-6 [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)]";

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
