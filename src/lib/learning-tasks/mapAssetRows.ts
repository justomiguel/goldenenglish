import type { LearningTaskAssetRow } from "@/types/learningTasks";

export type RawLearningTaskAsset = {
  id: string;
  kind: "file" | "embed";
  label: string;
  storage_path: string | null;
  mime_type: string | null;
  byte_size: number | null;
  embed_provider: "youtube" | "vimeo" | null;
  embed_url: string | null;
};

export function mapLearningTaskAssetRows(rows: RawLearningTaskAsset[]): LearningTaskAssetRow[] {
  return rows.map((row) => {
    if (row.kind === "file") {
      return {
        id: row.id,
        kind: "file",
        label: row.label,
        storagePath: row.storage_path ?? "",
        mimeType: row.mime_type ?? "",
        byteSize: Number(row.byte_size ?? 0),
      };
    }
    return {
      id: row.id,
      kind: "embed",
      label: row.label,
      embedProvider: row.embed_provider ?? "youtube",
      embedUrl: row.embed_url ?? "",
    };
  });
}
