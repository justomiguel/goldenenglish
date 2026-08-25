"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

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

      <AdminPageHeader title={title} lead={lead} iconId="cms" />
    </>
  );
}
