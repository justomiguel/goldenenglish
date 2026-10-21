export type TrackedFileUploadProgress = {
  phase: "preparing" | "uploading";
  percent: number | null;
};

export type TrackedFileUploadSnapshot = TrackedFileUploadProgress & {
  filename: string;
  current: number;
  total: number;
};
