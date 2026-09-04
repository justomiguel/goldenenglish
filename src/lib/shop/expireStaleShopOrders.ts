import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

const MS_24H = 24 * 60 * 60 * 1000;

export function isShopOrderExpired(createdAt: Date | string, now: Date): boolean {
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return now.getTime() - createdMs > MS_24H;
}

type ExpireAdmin = {
  from: (table: string) => {
    update: (values: { status: string; expired_at: string }) => {
      eq: (col: string, val: string) => {
        lt: (
          col: string,
          val: string,
        ) => Promise<{ error: { message?: string; code?: string } | null }>;
      };
    };
  };
};

export async function expireStaleShopOrders(input?: {
  admin?: ExpireAdmin;
  now?: Date;
}): Promise<void> {
  const now = input?.now ?? new Date();
  const admin = input?.admin ?? createAdminClient();
  const cutoff = new Date(now.getTime() - MS_24H).toISOString();
  const { error } = await admin
    .from("shop_orders")
    .update({ status: "expired", expired_at: now.toISOString() })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff);
  if (error) logSupabaseClientError("expireStaleShopOrders", error);
}
