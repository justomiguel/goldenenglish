import { pickContentMaterialsPanelLabels } from "@/lib/learning-content/pickContentMaterialsPanelLabels";
import type { Dictionary } from "@/types/i18n";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";

export function pickBlogMaterialsPanelLabels(
  academic: Dictionary["dashboard"]["adminContents"],
  blog: Dictionary["admin"]["cms"]["blog"]["editor"]["materials"],
): ContentMaterialsPanelLabels {
  const shared = pickContentMaterialsPanelLabels(academic);
  return {
    ...shared,
    draftMaterialsTitle: blog.title,
    draftMaterialsLead: blog.lead,
    materialLabelPlaceholder: blog.materialLabelPlaceholder,
    embedUrlPlaceholder: blog.embedUrlPlaceholder,
    builderAddEmbed: blog.addEmbed,
    builderFileLabel: blog.uploadFiles,
    builderFileHint: blog.uploadFilesHint,
    noMaterialsDraft: blog.empty,
  };
}
