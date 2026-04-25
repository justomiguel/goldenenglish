export const taskProgressStatuses = [
  "NOT_OPENED",
  "OPENED",
  "COMPLETED",
  "COMPLETED_LATE",
] as const;

export type TaskProgressStatus = (typeof taskProgressStatuses)[number];
export type ContentEmbedProvider = "youtube" | "vimeo";
export type ContentAssetKind = "file" | "embed";

export type TemplateFileAsset = {
  id: string;
  kind: "file";
  label: string;
  storagePath: string;
  mimeType: string;
  byteSize: number;
  sortOrder: number;
};

export type TemplateEmbedAsset = {
  id: string;
  kind: "embed";
  label: string;
  embedProvider: ContentEmbedProvider;
  embedUrl: string;
  sortOrder: number;
};

export type TemplateAsset = TemplateFileAsset | TemplateEmbedAsset;

export type TemplateCloneSource = {
  templateId: string;
  title: string;
  bodyHtml: string;
  assets: TemplateAsset[];
};

export type InstanceAssetClone =
  | (Omit<TemplateFileAsset, "id"> & { templateAssetId: string })
  | (Omit<TemplateEmbedAsset, "id"> & { templateAssetId: string });

export type TaskInstanceClonePayload = {
  templateId: string;
  title: string;
  bodyHtml: string;
  assets: InstanceAssetClone[];
};
