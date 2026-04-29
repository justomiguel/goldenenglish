"use client";

import Image from "next/image";
import { Award } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AdminBadgeImageEditor } from "@/components/dashboard/admin/badges/AdminBadgeImageEditor";
import type { AdminBadgesDict } from "@/components/dashboard/admin/badges/AdminBadgeFormFields";

export interface AdminBadgeEditMetaPanelProps {
  locale: string;
  badgeId: string;
  code: string;
  isActive: boolean;
  imageUrl: string | null;
  labels: AdminBadgesDict;
  pending: boolean;
  onTogglePause: () => void;
}

export function AdminBadgeEditMetaPanel(props: AdminBadgeEditMetaPanelProps) {
  const { locale, badgeId, code, isActive, imageUrl, labels, pending, onTogglePause } = props;
  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3">
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-muted)]"
          aria-hidden
        >
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <Award className="h-5 w-5 text-[var(--color-foreground)]" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {labels.colCode}
          </p>
          <p className="font-mono text-sm">{code}</p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {isActive ? labels.statusActive : labels.statusPaused}
          </p>
        </div>
        <div className="ml-auto">
          <Button type="button" variant="ghost" size="sm" onClick={onTogglePause} disabled={pending}>
            {isActive ? labels.pauseCta : labels.activateCta}
          </Button>
        </div>
      </div>
      <AdminBadgeImageEditor
        locale={locale}
        badgeId={badgeId}
        currentImageUrl={imageUrl}
        labels={labels}
        disabled={pending}
      />
    </section>
  );
}
