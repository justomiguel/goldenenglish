export type AdminWeeklyDigestTuition = {
  invoiceCount: number;
  paidCount: number;
  pendingCount: number;
  inReviewCount: number;
  expectedAmount: number;
  collectedAmount: number;
};

export type AdminWeeklyDigestFunnel = {
  invoices: number;
  openedPayments: number;
  checkoutsStarted: number;
  paidInvoices: number;
};

export type AdminWeeklyDigestParent = {
  firstName: string;
  lastName: string;
  sessions: number;
};

export type AdminWeeklyDigest = {
  pendingReceipts: number;
  openParentMessages: number;
  silentFamilies: number;
  tuition: AdminWeeklyDigestTuition;
  funnel: AdminWeeklyDigestFunnel;
  parentPercent: number;
  parentPercents: [number, number, number, number];
  topParents: AdminWeeklyDigestParent[];
  weekdaySessions: [number, number, number, number, number, number, number];
  attendanceMarkedSections: number;
  attendanceSections: number;
  tasksIncomplete: number;
  tasksDue: number;
  registrations: number;
  eventEnrollments: number;
  signedInSessions: number;
  publicPageViews: number;
};

export type DigestColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  foreground: string;
  background: string;
};
