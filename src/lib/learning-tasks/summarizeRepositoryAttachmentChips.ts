import { classifyAttachmentDisplayKind, type AttachmentDisplayKind } from "@/lib/learning-tasks/attachmentDisplayKind";

export type RepositoryAttachmentChip =
  | "embed"
  | "video"
  | "audio"
  | "image"
  | "pdf"
  | "office"
  | "other";

const CHIP_ORDER: RepositoryAttachmentChip[] = [
  "embed",
  "video",
  "audio",
  "image",
  "pdf",
  "office",
  "other",
];

export type RepositoryAssetSummaryInput = {
  kind: "file" | "embed";
  mimeType: string | null;
  label: string;
};

function attachmentKindToChip(kind: AttachmentDisplayKind): RepositoryAttachmentChip {
  if (kind === "word" || kind === "spreadsheet" || kind === "presentation" || kind === "office") return "office";
  if (kind === "embed") return "embed";
  if (kind === "video") return "video";
  if (kind === "audio") return "audio";
  if (kind === "image") return "image";
  if (kind === "pdf") return "pdf";
  return "other";
}

/** Counts draft assets by coarse type for repository list chips (Word/Excel/PPT merged into Office). */
export function summarizeRepositoryAttachmentChips(
  assets: RepositoryAssetSummaryInput[],
): { chip: RepositoryAttachmentChip; count: number }[] {
  const counts = new Map<RepositoryAttachmentChip, number>();
  for (const c of CHIP_ORDER) counts.set(c, 0);
  for (const asset of assets) {
    const k = classifyAttachmentDisplayKind({
      kind: asset.kind,
      mimeType: asset.mimeType,
      label: asset.label,
    });
    const chip = attachmentKindToChip(k);
    counts.set(chip, (counts.get(chip) ?? 0) + 1);
  }
  return CHIP_ORDER.map((chip) => ({ chip, count: counts.get(chip) ?? 0 })).filter((x) => x.count > 0);
}
