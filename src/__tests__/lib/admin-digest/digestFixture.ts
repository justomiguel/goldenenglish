import type { AdminWeeklyDigest } from "@/lib/admin-digest/adminWeeklyDigestTypes";

export function digestFixture(overrides: Partial<AdminWeeklyDigest> = {}): AdminWeeklyDigest {
  return {
    pendingReceipts: 4,
    openParentMessages: 2,
    silentFamilies: 11,
    tuition: {
      invoiceCount: 120,
      paidCount: 85,
      pendingCount: 28,
      inReviewCount: 7,
      expectedAmount: 2590000,
      collectedAmount: 1840000,
    },
    funnel: {
      invoices: 120,
      openedPayments: 86,
      checkoutsStarted: 34,
      paidInvoices: 85,
    },
    parentPercent: 62,
    parentPercents: [48, 55, 58, 62],
    topParents: [
      { firstName: "Camila", lastName: "Rojas", sessions: 9 },
      { firstName: "Luis", lastName: "Pérez", sessions: 7 },
      { firstName: "Marta", lastName: "Díaz", sessions: 6 },
    ],
    weekdaySessions: [20, 40, 28, 22, 18, 6, 4],
    attendanceMarkedSections: 8,
    attendanceSections: 10,
    tasksIncomplete: 7,
    tasksDue: 30,
    registrations: 3,
    eventEnrollments: 12,
    signedInSessions: 140,
    publicPageViews: 80,
    ...overrides,
  };
}
