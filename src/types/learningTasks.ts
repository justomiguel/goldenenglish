import type { ContentEmbedProvider, TaskProgressStatus } from "@/lib/learning-tasks/types";

export type LearningTaskAssetRow =
  | {
      id: string;
      kind: "file";
      label: string;
      storagePath: string;
      mimeType: string;
      byteSize: number;
      signedUrl?: string | null;
    }
  | {
      id: string;
      kind: "embed";
      label: string;
      embedProvider: ContentEmbedProvider;
      embedUrl: string;
    };

export type StudentLearningTaskRow = {
  taskInstanceId: string;
  progressId: string;
  title: string;
  bodyHtml: string;
  sectionName: string;
  startAt: string;
  dueAt: string;
  status: TaskProgressStatus;
  openedAt: string | null;
  completedAt: string | null;
  assets: LearningTaskAssetRow[];
};

export type TeacherLearningTaskRow = {
  taskInstanceId: string;
  title: string;
  sectionId: string;
  sectionName: string;
  dueAt: string;
  total: number;
  notOpened: number;
  opened: number;
  completed: number;
  completedLate: number;
};

export type ParentLearningTaskRow = {
  studentId: string;
  childLabel: string;
  taskInstanceId: string;
  title: string;
  sectionName: string;
  dueAt: string;
  status: TaskProgressStatus;
};
