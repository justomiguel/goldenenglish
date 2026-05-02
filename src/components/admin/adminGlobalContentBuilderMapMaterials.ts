import type {
  AdminGlobalDraftMaterial,
} from "@/components/admin/AdminGlobalContentMaterialsPanel";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";

export function mapExistingMaterials(
  content: ContentTemplateLibraryRow,
): AdminGlobalDraftMaterial[] {
  return content.assets.map((asset) => ({
    id: asset.id,
    existingAssetId: asset.id,
    kind: asset.kind,
    label: asset.label,
    url: asset.embedUrl ?? undefined,
    contentType: asset.mimeType ?? undefined,
  }));
}
