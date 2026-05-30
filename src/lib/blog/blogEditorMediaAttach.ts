export type BlogAttachChooserLabels = {
  title: string;
  lead: string;
  chooseYoutube: string;
  chooseFile: string;
  cancel: string;
  clipTooltip: string;
};

export type BlogEditorMediaAttachConfig = {
  labels: BlogAttachChooserLabels;
  onMediaFileUpload: (file: File) => Promise<{
    src: string;
    label: string;
    contentType: string;
  } | null>;
};
