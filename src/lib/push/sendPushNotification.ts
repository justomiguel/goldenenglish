import "server-only";

import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  logServerException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { loadVapidConfig, vapidConfigFromTenant } from "@/lib/push/loadVapidConfig";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { isMultiTenantEnabled, tenantRegistryError } from "@/lib/tenant/tenantRegistry";
import type { PushNotificationPayload } from "@/lib/push/pushNotificationPayload";

let lastVapidFingerprint: string | null = null;

async function ensureVapidConfigured(): Promise<boolean> {
  const config =
    isMultiTenantEnabled() && !tenantRegistryError()
      ? vapidConfigFromTenant(await resolveRequestTenant())
      : loadVapidConfig();
  if (!config) return false;
  const fingerprint = `${config.contactEmail}|${config.publicKey}|${config.privateKey}`;
  if (lastVapidFingerprint !== fingerprint) {
    webpush.setVapidDetails(`mailto:${config.contactEmail}`, config.publicKey, config.privateKey);
    lastVapidFingerprint = fingerprint;
  }
  return true;
}

function rowToSubscription(row: {
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}): PushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.keys_p256dh,
      auth: row.keys_auth,
    },
  };
}

export async function sendPushToUser(
  userId: string,
  payload: PushNotificationPayload,
): Promise<{ sent: number; removed: number }> {
  if (!(await ensureVapidConfigured())) {
    logServerWarn("push.sendPushToUser:vapid_unconfigured", { userId });
    return { sent: 0, removed: 0 };
  }

  const admin = await createAdminClient();
  const { data: rows, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth")
    .eq("user_id", userId);

  if (error) {
    logSupabaseClientError("push.sendPushToUser:load_subscriptions", error, { userId });
    return { sent: 0, removed: 0 };
  }

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  for (const row of rows ?? []) {
    try {
      await webpush.sendNotification(rowToSubscription(row), body);
      sent += 1;
      await admin
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", row.id);
    } catch (err) {
      const statusCode =
        err && typeof err === "object" && "statusCode" in err
          ? Number((err as { statusCode?: number }).statusCode)
          : undefined;
      if (statusCode === 404 || statusCode === 410) {
        const { error: delErr } = await admin.from("push_subscriptions").delete().eq("id", row.id);
        if (delErr) {
          logSupabaseClientError("push.sendPushToUser:delete_stale", delErr, {
            userId,
            subscriptionId: row.id,
          });
        } else {
          removed += 1;
        }
        continue;
      }
      logServerException("push.sendPushToUser:send_failed", err, {
        userId,
        subscriptionId: row.id,
        statusCode,
      });
    }
  }

  return { sent, removed };
}
