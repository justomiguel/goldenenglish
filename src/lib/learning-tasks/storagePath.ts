import { extensionForLearningTaskMime, type LearningTaskAcceptedMime } from "@/lib/learning-tasks/assets";

function safeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "asset";
}

export function buildLearningTaskAssetPath(input: {
  scope: "templates" | "instances";
  ownerId: string;
  assetId: string;
  filename: string;
  mime: LearningTaskAcceptedMime;
}): string {
  const ext = extensionForLearningTaskMime(input.mime);
  const base = safeSegment(input.filename.replace(/\.[^.]+$/, ""));
  return `${input.scope}/${input.ownerId}/${input.assetId}/${base}.${ext}`;
}
