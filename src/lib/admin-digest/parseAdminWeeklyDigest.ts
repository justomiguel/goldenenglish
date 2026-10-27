import { z } from "zod";
import type { AdminWeeklyDigest } from "@/lib/admin-digest/adminWeeklyDigestTypes";

const count = z.coerce.number().int().nonnegative();
const money = z.coerce.number().nonnegative();
const percent = z.coerce.number().int().min(0).max(100);
const fourPercents = z.tuple([percent, percent, percent, percent]);
const sevenCounts = z.tuple([count, count, count, count, count, count, count]);

const schema = z.object({
  pendingReceipts: count,
  openParentMessages: count,
  silentFamilies: count,
  tuition: z.object({
    invoiceCount: count,
    paidCount: count,
    pendingCount: count,
    inReviewCount: count,
    expectedAmount: money,
    collectedAmount: money,
  }),
  funnel: z.object({
    invoices: count,
    openedPayments: count,
    checkoutsStarted: count,
    paidInvoices: count,
  }),
  parentPercent: percent,
  parentPercents: fourPercents,
  topParents: z
    .array(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        sessions: count,
      }),
    )
    .max(3),
  weekdaySessions: sevenCounts,
  attendanceMarkedSections: count,
  attendanceSections: count,
  tasksIncomplete: count,
  tasksDue: count,
  registrations: count,
  eventEnrollments: count,
  signedInSessions: count,
  publicPageViews: count,
});

export function parseAdminWeeklyDigest(raw: unknown): AdminWeeklyDigest | null {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}
