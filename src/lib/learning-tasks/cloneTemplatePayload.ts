import type {
  InstanceAssetClone,
  TaskInstanceClonePayload,
  TemplateAsset,
  TemplateCloneSource,
} from "@/lib/learning-tasks/types";

function cloneAsset(asset: TemplateAsset): InstanceAssetClone {
  if (asset.kind === "file") {
    return {
      templateAssetId: asset.id,
      kind: "file",
      label: asset.label,
      storagePath: asset.storagePath,
      mimeType: asset.mimeType,
      byteSize: asset.byteSize,
      sortOrder: asset.sortOrder,
    };
  }

  return {
    templateAssetId: asset.id,
    kind: "embed",
    label: asset.label,
    embedProvider: asset.embedProvider,
    embedUrl: asset.embedUrl,
    sortOrder: asset.sortOrder,
  };
}

export function cloneTemplatePayload(source: TemplateCloneSource): TaskInstanceClonePayload {
  return {
    templateId: source.templateId,
    title: source.title,
    bodyHtml: source.bodyHtml,
    assets: source.assets.map(cloneAsset),
  };
}
