import "server-only";

import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  logServerException,
  logServerWarn,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";
import { loadVapidConfig } from "@/lib/push/loadVapidConfig";
import type { PushNotificationPayload } from "@/lib/push/pushNotificationPayload";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  const config = loadVapidConfig();
  if (!config) return false;
  webpush.setVapidDetails(`mailto:${config.contactEmail}`, config.publicKey, config.privateKey);
  vapidConfigured = true;
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
  if (!ensureVapidConfigured()) {
    logServerWarn("push.sendPushToUser:vapid_unconfigured", { userId });
    return { sent: 0, removed: 0 };
  }

  const admin = createAdminClient();
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
