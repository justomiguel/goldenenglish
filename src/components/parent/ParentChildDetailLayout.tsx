"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";

export interface ParentChildDetailLayoutProps {
  locale: string;
  title: string;
  lead?: string;
  backLabel: string;
  studentId: string | null;
  sectionId: string | null;
  tourAnchor?: string;
  children: ReactNode;
}

/**
 * Single-column frame for the `/parent/child/*` detail routes. With a two-level
 * hierarchy a back link says everything a breadcrumb would.
 */
export function ParentChildDetailLayout({
  locale,
  title,
  lead,
  backLabel,
  studentId,
  sectionId,
  tourAnchor,
  children,
}: ParentChildDetailLayoutProps) {
  const backHref = withParentFocusHref(`/${locale}/dashboard/parent/child`, {
    studentId,
    sectionId,
  });

  const head = (
    <div className="space-y-2">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Link>
      <header className="space-y-1" {...(tourAnchor ? { "data-tour": tourAnchor } : {})}>
        <h1 className="font-display text-xl font-bold text-[var(--color-foreground)] md:text-2xl">
          {title}
        </h1>
        {lead ? <p className="text-sm text-[var(--color-muted-foreground)]">{lead}</p> : null}
      </header>
    </div>
  );

  return (
    <SurfaceMountGate
      skeleton={<div className="space-y-5">{head}</div>}
      // A single list of records has no reason to run the full width of a monitor.
      desktop={
        <div className="max-w-3xl space-y-6">
          {head}
          {children}
        </div>
      }
      narrow={() => (
        <div className="space-y-4">
          {head}
          {children}
        </div>
      )}
    />
  );
}
