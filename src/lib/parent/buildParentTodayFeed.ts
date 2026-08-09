import type { ParentAttendanceMark } from "@/lib/parent/loadRecentAttendanceForStudentIds";
import type { StudentLearningTaskRow } from "@/types/learningTasks";

export type ParentTodayCardKind =
  | "paymentOverdue"
  | "unreadMessages"
  | "taskDueSoon"
  | "absence"
  | "paymentPending"
  | "enablePush";

export type ParentTodayCardTone = "urgent" | "attention" | "info";

export interface ParentTodayCard {
  kind: ParentTodayCardKind;
  tone: ParentTodayCardTone;
  /** How many items the card stands for; 1 when it is a single thing. */
  count: number;
  /** The item's own label when the card stands for exactly one. */
  detail: string | null;
  /** `null` for cards the client resolves itself, like the push permission prompt. */
  href: string | null;
}

export interface ParentTodayFeed {
  /** Every card, in urgency order. */
  cards: ParentTodayCard[];
  /** The first few, for the collapsed state. */
  visible: ParentTodayCard[];
  hasMore: boolean;
  /** Sources whose read failed; each becomes a retry card on screen. */
  failures: string[];
}

export interface ParentTodayHrefs {
  payments: string;
  messages: string;
  tasks: string;
  attendance: string;
}

export interface BuildParentTodayFeedInput {
  now: Date;
  hrefs: ParentTodayHrefs;
  overdueInvoiceCount: number;
  staffInboundCount: number;
  tasks: StudentLearningTaskRow[];
  attendanceMarks: ParentAttendanceMark[];
  paymentPending: boolean;
  /** True when the browser could still be asked for notification permission. */
  pushEligible: boolean;
  failedSources: string[];
}

const VISIBLE_LIMIT = 3;
const TASK_HORIZON_MS = 48 * 60 * 60 * 1000;
const ABSENCE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const UNFINISHED = new Set<StudentLearningTaskRow["status"]>(["NOT_OPENED", "OPENED"]);

function dueSoonTasks(input: BuildParentTodayFeedInput): StudentLearningTaskRow[] {
  const horizon = input.now.getTime() + TASK_HORIZON_MS;
  return input.tasks.filter((task) => {
    if (!UNFINISHED.has(task.status)) return false;
    const due = Date.parse(task.dueAt);
    // Something already past its deadline is more urgent, not less, so it stays in.
    return Number.isFinite(due) && due <= horizon;
  });
}

function recentAbsences(input: BuildParentTodayFeedInput): ParentAttendanceMark[] {
  const floor = input.now.getTime() - ABSENCE_WINDOW_MS;
  return input.attendanceMarks.filter((markRow) => {
    if (markRow.status !== "absent") return false;
    const on = Date.parse(markRow.attendedOn);
    return Number.isFinite(on) && on >= floor;
  });
}

/**
 * The answer to "is there anything that needs me?", ordered by what a family loses by
 * missing it rather than by when it happened.
 */
export function buildParentTodayFeed(input: BuildParentTodayFeedInput): ParentTodayFeed {
  const cards: ParentTodayCard[] = [];

  if (input.overdueInvoiceCount > 0) {
    cards.push({
      kind: "paymentOverdue",
      tone: "urgent",
      count: input.overdueInvoiceCount,
      detail: null,
      href: input.hrefs.payments,
    });
  }

  if (input.staffInboundCount > 0) {
    cards.push({
      kind: "unreadMessages",
      tone: "attention",
      count: input.staffInboundCount,
      detail: null,
      href: input.hrefs.messages,
    });
  }

  const tasks = dueSoonTasks(input);
  if (tasks.length > 0) {
    cards.push({
      kind: "taskDueSoon",
      tone: "attention",
      count: tasks.length,
      detail: tasks.length === 1 ? tasks[0].title : null,
      href: input.hrefs.tasks,
    });
  }

  const absences = recentAbsences(input);
  if (absences.length > 0) {
    cards.push({
      kind: "absence",
      tone: "attention",
      count: absences.length,
      detail: absences.length === 1 ? absences[0].sectionName : null,
      href: input.hrefs.attendance,
    });
  }

  if (input.paymentPending) {
    cards.push({
      kind: "paymentPending",
      tone: "info",
      count: 1,
      detail: null,
      href: input.hrefs.payments,
    });
  }

  if (input.pushEligible) {
    cards.push({ kind: "enablePush", tone: "info", count: 1, detail: null, href: null });
  }

  return sliceFeed(cards, input.failedSources);
}

function sliceFeed(cards: ParentTodayCard[], failures: string[]): ParentTodayFeed {
  return {
    cards,
    visible: cards.slice(0, VISIBLE_LIMIT),
    hasMore: cards.length > VISIBLE_LIMIT,
    failures: [...failures],
  };
}

/**
 * Whether the browser can still be asked for notification permission is only knowable
 * on the client, so that one card is appended after hydration rather than guessed on
 * the server.
 */
export function appendPushCard(feed: ParentTodayFeed): ParentTodayFeed {
  if (feed.cards.some((card) => card.kind === "enablePush")) return feed;
  const pushCard: ParentTodayCard = {
    kind: "enablePush",
    tone: "info",
    count: 1,
    detail: null,
    href: null,
  };
  return sliceFeed([...feed.cards, pushCard], feed.failures);
}
