import { BlogArticleAttachments } from "@/components/organisms/BlogArticleAttachments";
import { BlogArticleBodyHtml } from "@/components/organisms/BlogArticleBodyHtml";
import { BlogArticleDetailHero } from "@/components/molecules/BlogArticleDetailHero";
import { BlogArticleShareButton } from "@/components/molecules/BlogArticleShareButton";
import type { BlogAttachment } from "@/lib/blog/attachments";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

interface BlogArticleDetailMobileProps {
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

export function BlogArticleDetailMobile({
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
}: BlogArticleDetailMobileProps) {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-1 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
      <BlogArticleBodyHtml
        html={bodyHtml}
        labels={richContentLabels}
        className="space-y-5 px-2"
      />
      {shareUrl && shareLabel && shareCopiedLabel ? (
        <div className="flex justify-start px-2">
          <BlogArticleShareButton
            title={title}
            excerpt={excerpt}
            shareUrl={shareUrl}
            shareLabel={shareLabel}
            shareCopiedLabel={shareCopiedLabel}
          />
        </div>
      ) : null}
      <div className="px-2">
        <BlogArticleAttachments attachments={attachments} title={attachmentsTitle} />
      </div>
    </article>
  );
}
