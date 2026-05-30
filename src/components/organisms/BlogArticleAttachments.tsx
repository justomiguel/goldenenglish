import type { BlogAttachment } from "@/lib/blog/attachments";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import { resolveBlogEmbedDisplay } from "@/lib/blog/resolveBlogEmbedIframeSrc";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

interface BlogArticleAttachmentsProps {
  attachments: BlogAttachment[];
  title: string;
}

function filePublicUrl(storagePath: string): string {
  return blogMediaPublicUrl(readSupabasePublicEnv().url, storagePath);
}

export function BlogArticleAttachments({ attachments, title }: BlogArticleAttachmentsProps) {
  const ordered = attachments.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  if (ordered.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-[var(--color-border)] pt-6" aria-label={title}>
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h2>
      <ul className="space-y-4">
        {ordered.map((item, index) => (
          <li
            key={`${item.kind}:${item.kind === "file" ? item.storagePath : item.url}:${index}`}
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">{item.label}</p>
            {item.kind === "embed" ? <BlogEmbedBlock url={item.url} /> : <BlogFileBlock attachment={item} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BlogEmbedBlock({ url }: { url: string }) {
  const display = resolveBlogEmbedDisplay(url);

  if (display.mode === "link") {
    return (
      <a
        href={display.href}
        className="text-sm text-[var(--color-primary)] underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        {display.href}
      </a>
    );
  }

  const frameClassName =
    display.mode === "video"
      ? "aspect-video w-full overflow-hidden rounded-[var(--layout-border-radius)]"
      : "min-h-[480px] w-full overflow-hidden rounded-[var(--layout-border-radius)]";

  return (
    <div className={frameClassName}>
      <iframe
        src={display.embedUrl}
        title={url}
        className="h-full min-h-[inherit] w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function BlogFileBlock({ attachment }: { attachment: Extract<BlogAttachment, { kind: "file" }> }) {
  const src = filePublicUrl(attachment.storagePath);
  const mime = attachment.contentType ?? "";

  if (mime.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- public Supabase object URL
      <img src={src} alt={attachment.label} className="max-h-[480px] w-full rounded-md object-contain" />
    );
  }
  if (mime.startsWith("audio/")) {
    return <audio controls preload="metadata" src={src} className="w-full" />;
  }
  if (mime.startsWith("video/")) {
    return <video controls preload="metadata" src={src} className="max-h-[480px] w-full rounded-md" />;
  }

  return (
    <a
      href={src}
      className="inline-flex text-sm font-medium text-[var(--color-primary)] underline"
      rel="noopener noreferrer"
      target="_blank"
    >
      {attachment.filename ?? attachment.label}
    </a>
  );
}
