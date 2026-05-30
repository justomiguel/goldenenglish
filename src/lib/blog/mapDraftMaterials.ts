import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import type { BlogAttachment } from "@/lib/blog/attachments";

export function blogAttachmentsToDraftMaterials(
  attachments: BlogAttachment[],
): AdminGlobalDraftMaterial[] {
  return attachments
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: crypto.randomUUID(),
      kind: item.kind,
      label: item.label,
      url: item.kind === "embed" ? item.url : undefined,
      storagePath: item.kind === "file" ? item.storagePath : undefined,
      filename: item.kind === "file" ? item.filename : undefined,
      contentType: item.kind === "file" ? item.contentType : undefined,
      byteSize: item.kind === "file" ? item.byteSize : undefined,
    }));
}

export function draftMaterialsToBlogAttachments(
  materials: AdminGlobalDraftMaterial[],
): BlogAttachment[] {
  return materials.map((material, index) => {
    if (material.kind === "embed") {
      return {
        kind: "embed",
        label: material.label,
        url: material.url ?? "",
        sortOrder: index,
      };
    }
    return {
      kind: "file",
      label: material.label,
      storagePath: material.storagePath ?? "",
      filename: material.filename,
      contentType: material.contentType,
      byteSize: material.byteSize,
      sortOrder: index,
    };
  });
}
