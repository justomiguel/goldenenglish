import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { logServerAuthzDenied } from "@/lib/logging/serverActionLog";

export type MerchActionResult = { ok: true; id: string } | { ok: false; code: string };

export const merchLocaleSchema = z.string().min(2);

export function revalidateMerchPaths(locale: string): void {
  revalidatePath(`/${locale}/dashboard/admin/merch`);
  revalidatePath(`/${locale}/tienda`);
}

export async function requireMerchAdmin(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"]; user: { id: string } }
  | { ok: false; code: "forbidden" }
> {
  try {
    const session = await assertAdmin();
    return { ok: true, supabase: session.supabase, user: session.user };
  } catch {
    logServerAuthzDenied("merchAdmin");
    return { ok: false, code: "forbidden" };
  }
}

export function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}
