export type RichContentHtmlSegment = {
  kind: "html";
  html: string;
};

export type RichContentFileSegment = {
  kind: "file";
  href: string;
  label: string;
};

export type RichContentAudioSegment = {
  kind: "audio";
  src: string;
};

export type RichContentVideoSegment = {
  kind: "video";
  src: string;
};

export type RichContentEmbedSegment = {
  kind: "embed";
  src: string;
};

export type RichContentDisplaySegment =
  | RichContentHtmlSegment
  | RichContentFileSegment
  | RichContentAudioSegment
  | RichContentVideoSegment
  | RichContentEmbedSegment;

export type RichContentAttachmentTypeLabels = {
  pdf: string;
  word: string;
  spreadsheet: string;
  presentation: string;
  office: string;
  image: string;
  audio: string;
  video: string;
  other: string;
};

export type RichContentPdfViewerLabels = {
  viewPdf: string;
  loading: string;
  loadError: string;
  pageSummary: string;
  previousPage: string;
  nextPage: string;
  openInNewTab: string;
  zoomIn: string;
  zoomOut: string;
};

export type RichContentDisplayLabels = {
  downloadFile: string;
  audioLabel: string;
  videoLabel: string;
  attachmentTypes: RichContentAttachmentTypeLabels;
  pdfViewer: RichContentPdfViewerLabels;
  /** When set with `groupNonImageAttachments`, shown above trailing file/audio/video blocks. */
  attachmentsSectionTitle?: string;
};
