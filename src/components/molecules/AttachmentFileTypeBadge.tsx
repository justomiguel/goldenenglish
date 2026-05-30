import type { AttachmentDisplayKind } from "@/lib/learning-tasks/attachmentDisplayKind";

const FILE_TYPE_BADGE_STYLE: Record<AttachmentDisplayKind, string> = {
  embed: "bg-[var(--color-muted)] text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/25",
  pdf: "bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] ring-1 ring-inset ring-[var(--color-secondary)]/40",
  word: "bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/30",
  spreadsheet:
    "bg-[var(--color-success)]/15 text-[var(--color-success)] ring-1 ring-inset ring-[var(--color-success)]/35",
  presentation:
    "bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-1 ring-inset ring-[var(--color-warning)]/35",
  office:
    "bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-1 ring-inset ring-[var(--color-warning)]/35",
  image: "bg-[var(--color-accent)]/15 text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-accent)]/30",
  audio: "bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/30",
  video: "bg-[var(--color-primary)]/15 text-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/30",
  other: "bg-[var(--color-muted)] text-[var(--color-muted-foreground)] ring-1 ring-inset ring-[var(--color-border)]",
};

interface AttachmentFileTypeBadgeProps {
  kind: AttachmentDisplayKind;
  badgeLabel: string;
}

export function AttachmentFileTypeBadge({ kind, badgeLabel }: AttachmentFileTypeBadgeProps) {
  return (
    <span
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] text-[11px] font-bold leading-none tracking-tight ${FILE_TYPE_BADGE_STYLE[kind]}`}
      aria-hidden
    >
      {badgeLabel}
    </span>
  );
}
