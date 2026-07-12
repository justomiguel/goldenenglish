import { createUserPath, isCreateUserPath } from "@/lib/admin-tutorials/createUserPath";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { ADMIN_TOUR_ANCHORS, adminTourSelector } from "@/lib/admin-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";

/** Navigate to create-user page and wait for the form root. */
export async function ensureCreateUserPage(input: {
  locale: string;
  pathname: string;
  push: (href: string) => void;
  scope: string;
}): Promise<boolean> {
  if (!isCreateUserPath(input.pathname, input.locale)) {
    input.push(createUserPath(input.locale));
  }
  const form = await waitForSelector(adminTourSelector(ADMIN_TOUR_ANCHORS.createUserForm), {
    timeoutMs: 12_000,
  });
  if (!form) {
    logClientWarn(input.scope, { reason: "create_user_form_missing" });
    return false;
  }
  await waitForLayoutSettle(100);
  return true;
}
