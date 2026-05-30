import type { BlogArticleStatus } from "@/lib/blog/domain";

export type BlogActorRole = "admin" | "assistant" | "teacher" | "student" | "parent";

export interface BlogPermissionContext {
  actorRole: BlogActorRole;
  actorId: string;
  authorId: string;
  nextStatus: BlogArticleStatus;
}

export function canCreateArticle(actorRole: BlogActorRole): boolean {
  return actorRole === "admin" || actorRole === "assistant" || actorRole === "teacher";
}

export function canReviewArticles(actorRole: BlogActorRole): boolean {
  return actorRole === "admin" || actorRole === "assistant";
}

export function canModerateComments(actorRole: BlogActorRole): boolean {
  return canReviewArticles(actorRole);
}

export function canWriteArticle(ctx: BlogPermissionContext): boolean {
  const { actorRole, actorId, authorId, nextStatus } = ctx;
  if (!canCreateArticle(actorRole)) return false;

  if (actorRole === "admin" || actorRole === "assistant") return true;
  if (actorId !== authorId) return false;

  return nextStatus !== "published" && nextStatus !== "archived";
}
