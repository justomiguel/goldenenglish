import { describe, expect, it } from "vitest";
import { appendPushCard, buildParentTodayFeed } from "@/lib/parent/buildParentTodayFeed";
import type { BuildParentTodayFeedInput } from "@/lib/parent/buildParentTodayFeed";
import type { ParentAttendanceMark } from "@/lib/parent/loadRecentAttendanceForStudentIds";
import type { StudentLearningTaskRow } from "@/types/learningTasks";

const NOW = new Date("2026-03-10T12:00:00.000Z");

const HREFS = {
  payments: "/es/dashboard/parent/payments",
  messages: "/es/dashboard/parent/messages",
  tasks: "/es/dashboard/parent/child/tasks",
  attendance: "/es/dashboard/parent/child/attendance",
};

function input(over: Partial<BuildParentTodayFeedInput> = {}): BuildParentTodayFeedInput {
  return {
    now: NOW,
    hrefs: HREFS,
    overdueInvoiceCount: 0,
    staffInboundCount: 0,
    tasks: [],
    attendanceMarks: [],
    paymentPending: false,
    pushEligible: false,
    failedSources: [],
    ...over,
  };
}

function task(over: Partial<StudentLearningTaskRow> = {}): StudentLearningTaskRow {
  return {
    taskInstanceId: "t-1",
    title: "Homework",
    sectionName: "Teens A1",
    dueAt: "2026-03-11T12:00:00.000Z",
    status: "NOT_OPENED",
    ...over,
  };
}

function mark(over: Partial<ParentAttendanceMark> = {}): ParentAttendanceMark {
  return {
    markId: "m-1",
    attendedOn: "2026-03-09",
    status: "absent",
    studentId: "stu-1",
    studentName: "Ana",
    sectionId: "sec-1",
    sectionName: "Teens A1",
    ...over,
  };
}

describe("buildParentTodayFeed", () => {
  it("is empty when nothing needs the parent", () => {
    const feed = buildParentTodayFeed(input());
    expect(feed.cards).toEqual([]);
    expect(feed.hasMore).toBe(false);
  });

  it("orders cards by urgency rather than by recency", () => {
    const feed = buildParentTodayFeed(
      input({
        overdueInvoiceCount: 1,
        staffInboundCount: 2,
        tasks: [task()],
        attendanceMarks: [mark()],
        paymentPending: true,
        pushEligible: true,
      }),
    );

    expect(feed.cards.map((card) => card.kind)).toEqual([
      "paymentOverdue",
      "unreadMessages",
      "taskDueSoon",
      "absence",
      "paymentPending",
      "enablePush",
    ]);
  });

  it("shows at most three cards up front and reports the rest as more", () => {
    const feed = buildParentTodayFeed(
      input({ overdueInvoiceCount: 1, staffInboundCount: 1, tasks: [task()], pushEligible: true }),
    );

    expect(feed.visible).toHaveLength(3);
    expect(feed.hasMore).toBe(true);
    expect(feed.cards).toHaveLength(4);
  });

  it("counts only unfinished tasks whose deadline is inside the next two days", () => {
    const feed = buildParentTodayFeed(
      input({
        tasks: [
          task({ taskInstanceId: "soon", dueAt: "2026-03-11T00:00:00.000Z" }),
          task({ taskInstanceId: "later", dueAt: "2026-03-20T00:00:00.000Z" }),
          task({ taskInstanceId: "done", status: "COMPLETED" }),
          task({ taskInstanceId: "overdue", dueAt: "2026-03-01T00:00:00.000Z" }),
        ],
      }),
    );

    const card = feed.cards.find((entry) => entry.kind === "taskDueSoon");
    // The overdue one still needs doing, so it counts; the far-off and finished ones do not.
    expect(card?.count).toBe(2);
  });

  it("names the task when there is exactly one", () => {
    const feed = buildParentTodayFeed(input({ tasks: [task({ title: "Unit 3 reading" })] }));
    expect(feed.cards[0]?.detail).toBe("Unit 3 reading");
  });

  it("counts unexcused absences in the last two weeks and ignores the rest", () => {
    const feed = buildParentTodayFeed(
      input({
        attendanceMarks: [
          mark({ markId: "a", attendedOn: "2026-03-09", status: "absent" }),
          mark({ markId: "b", attendedOn: "2026-03-08", status: "excused" }),
          mark({ markId: "c", attendedOn: "2026-03-07", status: "late" }),
          mark({ markId: "d", attendedOn: "2026-02-01", status: "absent" }),
        ],
      }),
    );

    expect(feed.cards.find((card) => card.kind === "absence")?.count).toBe(1);
  });

  it("gives every card a destination except the ones the client has to handle", () => {
    const feed = buildParentTodayFeed(
      input({
        overdueInvoiceCount: 1,
        staffInboundCount: 1,
        tasks: [task()],
        attendanceMarks: [mark()],
        pushEligible: true,
      }),
    );

    const byKind = Object.fromEntries(feed.cards.map((card) => [card.kind, card.href]));
    expect(byKind.paymentOverdue).toBe(HREFS.payments);
    expect(byKind.unreadMessages).toBe(HREFS.messages);
    expect(byKind.taskDueSoon).toBe(HREFS.tasks);
    expect(byKind.absence).toBe(HREFS.attendance);
    expect(byKind.enablePush).toBeNull();
  });

  it("surfaces a retry card per failed source, ahead of everything else", () => {
    const feed = buildParentTodayFeed(
      input({ overdueInvoiceCount: 1, failedSources: ["messages", "tasks"] }),
    );

    expect(feed.failures).toEqual(["messages", "tasks"]);
    // A source that failed is not the same as a source with nothing to report, so the
    // alert cards it would have produced must never be assumed absent.
    expect(feed.visible.map((card) => card.kind)).toEqual(["paymentOverdue"]);
  });

  it("appends the push card last and never twice", () => {
    const base = buildParentTodayFeed(input({ overdueInvoiceCount: 1 }));
    const once = appendPushCard(base);
    expect(once.cards.map((card) => card.kind)).toEqual(["paymentOverdue", "enablePush"]);
    expect(appendPushCard(once)).toBe(once);
  });

  it("recomputes what is visible after the push card lands", () => {
    const base = buildParentTodayFeed(
      input({ overdueInvoiceCount: 1, staffInboundCount: 1, tasks: [task()] }),
    );
    expect(base.hasMore).toBe(false);
    expect(appendPushCard(base).hasMore).toBe(true);
  });

  it("marks overdue payments as urgent and the rest as softer tones", () => {
    const feed = buildParentTodayFeed(
      input({ overdueInvoiceCount: 2, staffInboundCount: 1, pushEligible: true }),
    );
    const byKind = Object.fromEntries(feed.cards.map((card) => [card.kind, card.tone]));
    expect(byKind.paymentOverdue).toBe("urgent");
    expect(byKind.unreadMessages).toBe("attention");
    expect(byKind.enablePush).toBe("info");
  });
});
