"use client";

import { ArrowUpRight } from "lucide-react";

interface BlogArticleCtaLinkProps {
  label: string;
  href: string;
  articleId: string;
  locale: string;
  fullWidth?: boolean;
}

export function BlogArticleCtaLink({
  label,
  href,
  articleId,
  locale,
  fullWidth = false,
}: BlogArticleCtaLinkProps) {
  async function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    try {
      await fetch("/api/blog/metrics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "cta_click",
          articleId,
          source: null,
          locale,
        }),
      });
    } catch {
      // The click still opens the link when metrics fail.
    }
    window.location.assign(href);
  }

  return (
    <a
      href={href}
      onClick={(event) => void onClick(event)}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] ${fullWidth ? "w-full" : ""}`}
    >
      <ArrowUpRight aria-hidden className="h-4 w-4" />
      {label}
    </a>
  );
}
