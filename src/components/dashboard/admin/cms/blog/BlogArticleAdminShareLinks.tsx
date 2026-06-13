"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import type { BlogArticleAdminShareLink } from "@/lib/blog/server/resolveBlogArticleAdminShareLinks";
import type { BlogLocale } from "@/lib/blog/domain";

interface BlogArticleAdminShareLinksProps {
  links: BlogArticleAdminShareLink[];
  localeTabLabels: Record<BlogLocale, string>;
  title: string;
  previewHint: string;
  copyLabel: string;
  copiedLabel: string;
  openLabel: string;
}

export function BlogArticleAdminShareLinks({
  links,
  localeTabLabels,
  title,
  previewHint,
  copyLabel,
  copiedLabel,
  openLabel,
}: BlogArticleAdminShareLinksProps) {
  const [copiedLocale, setCopiedLocale] = useState<BlogLocale | null>(null);

  if (links.length === 0) return null;

  const hasPreview = links.some((link) => link.kind === "preview");

  async function onCopy(locale: BlogLocale, url: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(url);
    setCopiedLocale(locale);
    window.setTimeout(() => setCopiedLocale(null), 2200);
  }

  return (
    <section
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4"
      aria-labelledby="blog-share-links-title"
    >
      <h2
        id="blog-share-links-title"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-foreground)]"
      >
        <Link2 aria-hidden className="h-4 w-4" />
        {title}
      </h2>
      {hasPreview ? (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{previewHint}</p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {links.map((link) => {
          const copied = copiedLocale === link.locale;
          return (
            <li
              key={link.locale}
              className="flex flex-col gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  {localeTabLabels[link.locale]}
                </p>
                <p className="truncate text-sm text-[var(--color-foreground)]">{link.url}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium"
                  onClick={() => void onCopy(link.locale, link.url)}
                >
                  {copied ? (
                    <Check aria-hidden className="h-3.5 w-3.5" />
                  ) : (
                    <Copy aria-hidden className="h-3.5 w-3.5" />
                  )}
                  {copied ? copiedLabel : copyLabel}
                </button>
                <a
                  href={link.pathname}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium"
                >
                  <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  {openLabel}
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
