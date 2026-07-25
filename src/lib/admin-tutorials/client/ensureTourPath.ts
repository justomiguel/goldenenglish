import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { waitForLayoutSettle } from "@/lib/admin-tutorials/client/tourLayoutSync";
import { adminTourSelector } from "@/lib/admin-tutorials/selectors";
import { logClientWarn } from "@/lib/logging/clientLog";
import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";

export {
  academicSectionAttendancePath,
  blogNewPath,
  eventsNewPath,
  eventPaymentsPath,
  financeInboxPath,
  financeSettingsPath,
  FINANCE_INBOX_WAIT_ANCHOR,
  FINANCE_SETTINGS_WAIT_ANCHOR,
  EVENT_PAYMENTS_WAIT_ANCHOR,
  isBlogNewPath,
  isEventsNewPath,
  isEventPaymentsPath,
  isFinanceInboxPath,
  isFinanceSettingsPath,
  isSectionCollectionsPath,
  isSiteSetupPath,
  isUsersImportPath,
  sectionCollectionsPath,
  siteSetupPath,
  SITE_SETUP_WAIT_ANCHOR,
  SECTION_COLLECTIONS_WAIT_ANCHOR,
  studentBillingPath,
  studentDetailPath,
  usersImportPath,
} from "@/lib/admin-tutorials/tourPaths";

/** Navigate (if needed) and wait for a required tour anchor. */
export async function ensureTourPath(input: {
  locale: string;
  pathname: string;
  targetPath: string;
  alreadyOnPath: boolean;
  waitAnchor: AdminTourAnchor;
  push: (href: string) => void;
  scope: string;
  reason: string;
  timeoutMs?: number;
}): Promise<boolean> {
  if (!input.alreadyOnPath) {
    input.push(input.targetPath);
  }
  const el = await waitForSelector(adminTourSelector(input.waitAnchor), {
    timeoutMs: input.timeoutMs ?? 12_000,
  });
  if (!el) {
    logClientWarn(input.scope, { reason: input.reason });
    return false;
  }
  await waitForLayoutSettle(100);
  return true;
}
