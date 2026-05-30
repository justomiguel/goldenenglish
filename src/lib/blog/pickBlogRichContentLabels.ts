import type { Dictionary } from "@/types/i18n";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

export function pickBlogRichContentLabels(dict: Dictionary): RichContentDisplayLabels {
  const labels = dict.blog.detail;
  return {
    downloadFile: labels.downloadFile,
    audioLabel: labels.audioLabel,
    videoLabel: labels.videoLabel,
    attachmentTypes: labels.attachmentTypes,
    pdfViewer: labels.pdfViewer,
  };
}
