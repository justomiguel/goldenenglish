import {
  extensionForLearningTaskMime,
  type LearningTaskAcceptedMime,
} from "@/lib/learning-tasks/assets";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export const SHOP_MEDIA_BUCKET = "shop-media";

export function buildShopMediaStoragePath(input: {
  productId?: string;
  actorId: string;
  mime: LearningTaskAcceptedMime;
}): string {
  const ext = extensionForLearningTaskMime(input.mime);
  const id = crypto.randomUUID();
  const scope = input.productId
    ? `products/${input.productId}`
    : `drafts/${input.actorId}`;
  return `${scope}/${id}.${ext}`;
}

export function shopMediaPublicUrl(supabaseProjectUrl: string, storagePath: string): string {
  const base = supabaseProjectUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${SHOP_MEDIA_BUCKET}/${storagePath}`;
}

export function shopProductImagePublicUrl(path: string | null | undefined): string | null {
  if (typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  try {
    return shopMediaPublicUrl(readSupabasePublicEnv().url, trimmed);
  } catch {
    return null;
  }
}
