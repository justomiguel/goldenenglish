import Link from "next/link";
import { MediaAudioPlaylist } from "@/components/admin/MediaAudioPlaylist";
import { MediaSequenceViewer } from "@/components/admin/MediaSequenceViewer";
import { collapseRichTextDisplayHtml } from "@/lib/learning-tasks/collapseRichTextDisplayHtml";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";

interface AdminGlobalContentReadOnlyProps {
  locale: string;
  content: ContentTemplateLibraryRow;
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminGlobalContentReadOnly({
  locale,
  content,
  labels,
}: AdminGlobalContentReadOnlyProps) {
  const bodyHtml = collapseRichTextDisplayHtml(content.bodyHtml ?? "");
  return (
    <article className="space-y-5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-card)]">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-primary)]">{labels.globalViewReadOnlyBadge}</p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--color-foreground)]">{content.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-foreground)]">
            {content.description || labels.noDescription}
          </p>
        </div>
        <Link
          href={`/${locale}/dashboard/admin/academic/contents/global/${content.id}/edit`}
          className="inline-flex rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          {labels.edit}
        </Link>
      </header>
      <section
        className="prose prose-sm mx-auto w-full max-w-prose overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-foreground)] [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:min-h-0 [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-[var(--layout-border-radius)] [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)] [&_p:empty]:hidden [&_p]:my-2 [&_table]:max-w-full [&_table]:text-sm [&_td]:border [&_td]:border-[var(--color-border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--color-border)] [&_th]:p-2"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
      <MediaSequenceViewer content={content} labels={labels} />
      <MediaAudioPlaylist content={content} labels={labels} />
      {content.assets.length > 0 ? (
        <section>
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{labels.draftMaterialsTitle}</h3>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {content.assets.map((asset) => (
              <li key={asset.id} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                <span className="block font-medium text-[var(--color-foreground)]">{asset.label}</span>
                <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
                  {asset.kind === "embed" ? asset.embedUrl : asset.mimeType ?? labels.fileKind}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
