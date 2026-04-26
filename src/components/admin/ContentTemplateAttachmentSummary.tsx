"use client";

import { useMemo } from "react";
import {
  FileText,
  Files,
  Headphones,
  Image as ImageIcon,
  MonitorPlay,
  Video,
} from "lucide-react";
import {
  type RepositoryAttachmentChip,
  summarizeRepositoryAttachmentChips,
} from "@/lib/learning-tasks/summarizeRepositoryAttachmentChips";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

const CHIP_LABEL_KEY: Record<RepositoryAttachmentChip, keyof Labels> = {
  embed: "repositoryChipEmbed",
  video: "repositoryChipVideo",
  audio: "repositoryChipAudio",
  image: "repositoryChipImage",
  pdf: "repositoryChipPdf",
  office: "repositoryChipOffice",
  other: "repositoryChipOther",
};

const chipIconClass = "h-3.5 w-3.5 shrink-0";

function ChipIcon({ chip }: { chip: RepositoryAttachmentChip }) {
  const stroke = { strokeWidth: 2.25 } as const;
  switch (chip) {
    case "embed":
      return <MonitorPlay className={chipIconClass} aria-hidden {...stroke} />;
    case "video":
      return <Video className={chipIconClass} aria-hidden {...stroke} />;
    case "audio":
      return <Headphones className={chipIconClass} aria-hidden {...stroke} />;
    case "image":
      return <ImageIcon className={chipIconClass} aria-hidden {...stroke} />;
    case "pdf":
      return <FileText className={chipIconClass} aria-hidden {...stroke} />;
    default:
      return <Files className={chipIconClass} aria-hidden {...stroke} />;
  }
}

function chipLabel(labels: Labels, chip: RepositoryAttachmentChip, count: number): string {
  const raw = labels[CHIP_LABEL_KEY[chip]] as string;
  return raw.replace("{count}", String(count));
}

const chipSurface: Record<RepositoryAttachmentChip, string> = {
  embed:
    "border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))] text-[var(--color-accent)]",
  video:
    "border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-[var(--color-primary)]",
  audio:
    "border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] text-[var(--color-primary)]",
  image:
    "border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-surface))] text-[var(--color-accent)]",
  pdf:
    "border-[color-mix(in_srgb,var(--color-secondary)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-surface))] text-[var(--color-secondary)]",
  office:
    "border-[color-mix(in_srgb,var(--color-warning)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--color-surface))] text-[var(--color-warning)]",
  other:
    "border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
};

export function ContentTemplateAttachmentSummary({
  assets,
  labels,
  listClassName,
}: {
  assets: ContentTemplateLibraryRow["assets"];
  labels: Labels;
  /** When set, replaces default list layout classes (e.g. corner alignment in repository cards). */
  listClassName?: string;
}) {
  const chips = useMemo(() => summarizeRepositoryAttachmentChips(assets), [assets]);
  if (chips.length === 0) return null;
  const ulClass = listClassName ?? "mt-2 flex flex-wrap gap-1.5";
  return (
    <ul className={ulClass} aria-label={labels.repositoryAttachmentSummaryAria}>
      {chips.map(({ chip, count }) => {
        const text = chipLabel(labels, chip, count);
        return (
          <li key={chip}>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums ${chipSurface[chip]}`}
              title={text}
            >
              <ChipIcon chip={chip} />
              <span>{text}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
