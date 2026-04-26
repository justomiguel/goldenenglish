"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export interface HeroVisualEditorShellTopProps {
  backHref: string;
  backLabel: string;
  title: string;
  lead: string;
}

export function HeroVisualEditorShellTop({
  backHref,
  backLabel,
  title,
  lead,
}: HeroVisualEditorShellTopProps) {
  return (
    <>
      <Link
        href={backHref}
        className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
        {backLabel}
      </Link>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{title}</h1>
        <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      </header>
    </>
  );
}
