export type BlogAttachChooserLabels = {
  title: string;
  lead: string;
  chooseYoutube: string;
  chooseFile: string;
  cancel: string;
  clipTooltip: string;
};

export type BlogEditorUploadedMedia = {
  src: string;
  label: string;
  contentType: string;
};

export type BlogEditorMediaAttachConfig = {
  labels: BlogAttachChooserLabels;
  onMediaFileUpload: (file: File) => Promise<BlogEditorUploadedMedia | null>;
  /** When set, a multi-file picker is one batch (one progress modal). */
  onMediaFilesUpload?: (files: File[]) => Promise<Array<BlogEditorUploadedMedia | null>>;
};
