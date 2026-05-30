import { BlogArticleAttachments } from "@/components/organisms/BlogArticleAttachments";
import type { BlogAttachment } from "@/lib/blog/attachments";

interface BlogArticleDetailMobileProps {
  title: string;
  excerpt: string;
  bodyHtml: string;
  attachments: BlogAttachment[];
  attachmentsTitle: string;
}

export function BlogArticleDetailMobile({
  title,
  excerpt,
  bodyHtml,
  attachments,
  attachmentsTitle,
}: BlogArticleDetailMobileProps) {
  return (
    <article className="space-y-3 px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{excerpt}</p>
      <div
        className="prose prose-sm prose-neutral max-w-none text-[var(--color-foreground)]"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      <BlogArticleAttachments attachments={attachments} title={attachmentsTitle} />
    </article>
  );
}
