import {
  extensionForLearningTaskMime,
  type LearningTaskAcceptedMime,
} from "@/lib/learning-tasks/assets";

export const BLOG_MEDIA_BUCKET = "blog-media";

export function buildBlogMediaStoragePath(input: {
  articleId?: string;
  actorId: string;
  mime: LearningTaskAcceptedMime;
}): string {
  const ext = extensionForLearningTaskMime(input.mime);
  const id = crypto.randomUUID();
  const scope = input.articleId
    ? `articles/${input.articleId}`
    : `drafts/${input.actorId}`;
  return `${scope}/${id}.${ext}`;
}

export function blogMediaPublicUrl(supabaseProjectUrl: string, storagePath: string): string {
  const base = supabaseProjectUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BLOG_MEDIA_BUCKET}/${storagePath}`;
}
