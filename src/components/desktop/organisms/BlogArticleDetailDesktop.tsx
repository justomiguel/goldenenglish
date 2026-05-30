import { BlogArticleAttachments } from "@/components/organisms/BlogArticleAttachments";
import type { BlogAttachment } from "@/lib/blog/attachments";

interface BlogArticleDetailDesktopProps {
  title: string;
  excerpt: string;
  bodyHtml: string;
  attachments: BlogAttachment[];
  attachmentsTitle: string;
}

export function BlogArticleDetailDesktop({
  title,
  excerpt,
  bodyHtml,
  attachments,
  attachmentsTitle,
}: BlogArticleDetailDesktopProps) {
  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{excerpt}</p>
      <div
        className="prose prose-neutral max-w-none text-[var(--color-foreground)]"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      <BlogArticleAttachments attachments={attachments} title={attachmentsTitle} />
    </article>
  );
}
