import "server-only";

import { sendPushToUser } from "@/lib/push/sendPushNotification";
import type { PushNotificationPayload } from "@/lib/push/pushNotificationPayload";
import { logServerException } from "@/lib/logging/serverActionLog";

/** Fire-and-forget Web Push after primary notification channels; never throws outward. */
export async function pushAfterNotify(
  userId: string,
  payload: PushNotificationPayload,
  scope: string,
): Promise<void> {
  try {
    await sendPushToUser(userId, payload);
  } catch (err) {
    logServerException(`${scope}:push_after_notify`, err, { userId });
  }
}
