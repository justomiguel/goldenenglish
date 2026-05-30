import { BlogArticleAttachments } from "@/components/organisms/BlogArticleAttachments";
import { BlogArticleBodyHtml } from "@/components/organisms/BlogArticleBodyHtml";
import { BlogArticleDetailHero } from "@/components/molecules/BlogArticleDetailHero";
import { BlogArticleShareButton } from "@/components/molecules/BlogArticleShareButton";
import type { BlogAttachment } from "@/lib/blog/attachments";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

interface BlogArticleDetailDesktopProps {
  locale: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl: string | null;
  coverUnoptimized: boolean;
  attachments: BlogAttachment[];
  attachmentsTitle: string;
  heroLabels: {
    backToBlog: string;
    articleEyebrow: string;
    publishedDateAria: string;
  };
  displayDate: string;
  displayDateIso: string;
  viewsLabel: string;
  richContentLabels: RichContentDisplayLabels;
  shareUrl?: string;
  shareLabel?: string;
  shareCopiedLabel?: string;
}

export function BlogArticleDetailDesktop({
  locale,
  title,
  excerpt,
  bodyHtml,
  coverImageUrl,
  coverUnoptimized,
  attachments,
  attachmentsTitle,
  heroLabels,
  displayDate,
  displayDateIso,
  viewsLabel,
  richContentLabels,
  shareUrl,
  shareLabel,
  shareCopiedLabel,
}: BlogArticleDetailDesktopProps) {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-8">
      <BlogArticleDetailHero
        locale={locale}
        title={title}
        coverImageUrl={coverImageUrl}
        coverUnoptimized={coverUnoptimized}
        displayDate={displayDate}
        displayDateIso={displayDateIso}
        viewsLabel={viewsLabel}
        labels={heroLabels}
      />
      <BlogArticleBodyHtml html={bodyHtml} labels={richContentLabels} />
      {shareUrl && shareLabel && shareCopiedLabel ? (
        <div className="flex justify-start">
          <BlogArticleShareButton
            title={title}
            excerpt={excerpt}
            shareUrl={shareUrl}
            shareLabel={shareLabel}
            shareCopiedLabel={shareCopiedLabel}
          />
        </div>
      ) : null}
      <BlogArticleAttachments attachments={attachments} title={attachmentsTitle} />
    </article>
  );
}
