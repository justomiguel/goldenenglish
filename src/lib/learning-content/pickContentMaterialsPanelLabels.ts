import type { Dictionary } from "@/types/i18n";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";

export function pickContentMaterialsPanelLabels(
  labels: Dictionary["dashboard"]["adminContents"],
): ContentMaterialsPanelLabels {
  return {
    draftMaterialsTitle: labels.draftMaterialsTitle,
    draftMaterialsLead: labels.draftMaterialsLead,
    materialLabelPlaceholder: labels.materialLabelPlaceholder,
    embedUrlPlaceholder: labels.embedUrlPlaceholder,
    builderAddEmbed: labels.builderAddEmbed,
    builderFileLabel: labels.builderFileLabel,
    builderFileHint: labels.builderFileHint,
    noMaterialsDraft: labels.noMaterialsDraft,
    dragMaterial: labels.dragMaterial,
    dragHandle: labels.dragHandle,
    embedKind: labels.embedKind,
    fileKind: labels.fileKind,
    moveUp: labels.moveUp,
    moveDown: labels.moveDown,
    remove: labels.remove,
  };
}
