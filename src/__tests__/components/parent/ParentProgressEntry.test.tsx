// REGRESSION CHECK: Progress replaced a four-tab bar with a picker. The contract that must hold:
// only sections with content are offered, `?tab=` deep links still land where they can (and degrade
// instead of blanking), exactly one section renders at a time, and unread counts come from what this
// device has already opened.

import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { mockSearchParams } from "@/test/navigationMock";
import { installMemoryLocalStorage } from "@/__tests__/helpers/installMemoryLocalStorage";
import { progressSeenStorageKey } from "@/lib/parent/progressSeenStorage";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { StudentLearningTaskRow } from "@/types/learningTasks";
import type { StudentMiniTestAssessment } from "@/types/learningContent";
import type { ParentFeedbackTimeline } from "@/types/parentFeedback";
import type { StudentBadgeRowModel } from "@/types/studentBadges";
import type { StudentExamResult } from "@/types/studentExams";

const mockUseAppSurface = vi.fn<() => AppSurface>();

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

import { ParentProgressEntry } from "@/components/parent/ParentProgressEntry";
const TASK: StudentLearningTaskRow = {
  taskInstanceId: "task-1",
  progressId: "prog-1",
  title: "Unit 3 reading",
  bodyHtml: "<p>Read chapter 3</p>",
  sectionName: "B1 — Group A",
  startAt: "2026-08-01",
  dueAt: "2026-08-10",
  status: "NOT_OPENED",
  openedAt: null,
  completedAt: null,
  assets: [],
};

const MINI_TEST: StudentMiniTestAssessment = {
  id: "mt-1",
  title: "Present perfect check",
  assessmentKind: "mini_test",
  gradingMode: "numeric",
  sectionName: "B1 — Group A",
  latestAttemptStatus: null,
  questions: [],
};

const FEEDBACK_TEXT = "Zara reads with real confidence now.";

const TIMELINE: ParentFeedbackTimeline = {
  items: [
    {
      id: "assessment:enr-1:asm-1",
      source: "assessment",
      studentId: "stu-1",
      childLabel: "Adams Zara",
      title: "Unit 3 exam",
      contextLabel: "B1 — Group A",
      teacherName: "Ruiz Marta",
      occurredOn: "2026-08-05",
      score: 82,
      maxScore: 100,
      feedback: FEEDBACK_TEXT,
      isNew: true,
    },
  ],
  newCount: 1,
};

const EMPTY_TIMELINE: ParentFeedbackTimeline = { items: [], newCount: 0 };

const EXAM: StudentExamResult = {
  id: "asm-1",
  name: "Unit 3 exam",
  sectionName: "B1 — Group A",
  examOn: "2026-08-05",
  maxScore: 10,
  score: null,
  hasTeacherFeedback: false,
  state: "pending",
};

const LOCKED_BADGE: StudentBadgeRowModel = {
  id: "badge-locked",
  badgeCode: "first_task",
  earnedAt: null,
  shareUrl: "",
  locked: true,
  progress: null,
};

const WARDS = [{ studentId: "stu-1", displayName: "Adams Zara" }];

const picker = dictEn.dashboard.parent.progressPicker;

type Data = {
  exams?: StudentExamResult[];
  tasks?: StudentLearningTaskRow[];
  assessments?: StudentMiniTestAssessment[];
  feedback?: ParentFeedbackTimeline;
  badgeRows?: StudentBadgeRowModel[];
};

async function renderEntry(data: Data = {}, surface: AppSurface = "web-desktop") {
  mockUseAppSurface.mockReturnValue(surface);
  render(
    <ParentProgressEntry
      locale="en"
      wardOptions={WARDS}
      selectedStudentId="stu-1"
      exams={data.exams ?? []}
      tasks={data.tasks ?? [TASK]}
      assessments={data.assessments ?? [MINI_TEST]}
      feedback={data.feedback ?? TIMELINE}
      badgeRows={data.badgeRows ?? [LOCKED_BADGE]}
      parentLabels={dictEn.dashboard.parent}
      studentLabels={dictEn.dashboard.student}
      badgesDict={dictEn.dashboard.student.badges}
    />,
  );
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  installMemoryLocalStorage();
});

describe("ParentProgressEntry", () => {
  it("offers only the sections that have something to show", async () => {
    const user = userEvent.setup();
    await renderEntry();

    await user.click(screen.getByRole("combobox", { name: /section/i }));

    const labels = screen.getAllByRole("option").map((option) => option.textContent ?? "");
    expect(labels.some((text) => text.includes(picker.sectionTasks))).toBe(true);
    expect(labels.some((text) => text.includes(picker.sectionFeedback))).toBe(true);
    expect(labels.some((text) => text.includes(picker.sectionBadges))).toBe(false);
  });

  it("offers the exams a teacher created, even before anyone grades them", async () => {
    const user = userEvent.setup();
    await renderEntry({ exams: [EXAM] });

    await user.click(screen.getByRole("combobox", { name: /section/i }));

    const labels = screen.getAllByRole("option").map((option) => option.textContent ?? "");
    expect(labels.some((text) => text.includes(picker.sectionExams))).toBe(true);
  });

  it("opens on the exams, which is what families come for", async () => {
    await renderEntry({ exams: [EXAM] });

    expect(screen.getByText(EXAM.name)).toBeInTheDocument();
    expect(screen.queryByText(TASK.title)).not.toBeInTheDocument();
  });

  it("shows one section at a time instead of four stacked panels", async () => {
    await renderEntry();

    expect(screen.getByText(TASK.title)).toBeInTheDocument();
    expect(screen.queryByText(FEEDBACK_TEXT)).not.toBeInTheDocument();
  });

  it("opens on the section named by ?tab=", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=feedback"));
    await renderEntry();

    expect(screen.getByText(FEEDBACK_TEXT)).toBeInTheDocument();
  });

  it("opens a deep-linked empty section so tour anchors still mount", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("tab=badges"));
    await renderEntry();

    expect(document.querySelector('[data-tour="parent-badges-body"]')).toBeTruthy();
    expect(screen.queryByText(TASK.title)).not.toBeInTheDocument();
  });

  it("switches sections from the picker", async () => {
    const user = userEvent.setup();
    await renderEntry();

    await user.click(screen.getByRole("combobox", { name: /section/i }));
    await user.click(
      screen.getByRole("option", { name: new RegExp(picker.sectionFeedback) }),
    );

    expect(screen.getByText(FEEDBACK_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(TASK.title)).not.toBeInTheDocument();
  });

  it("flags the sections this device has not opened yet", async () => {
    const user = userEvent.setup();
    await renderEntry();

    // Tasks is the section on screen, so only Assessments and Feedback stay pending.
    expect(screen.getByText(picker.unreadMany.replace("{count}", "2"))).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: /section/i }));

    expect(
      screen.getByLabelText(`1 unread in ${picker.sectionFeedback}`),
    ).toBeInTheDocument();
  });

  it("stops flagging a section once it has been visited", async () => {
    window.localStorage.setItem(
      progressSeenStorageKey("stu-1"),
      JSON.stringify({ feedback: ["assessment:enr-1:asm-1"] }),
    );
    const user = userEvent.setup();
    await renderEntry();

    await user.click(screen.getByRole("combobox", { name: /section/i }));

    expect(
      screen.queryByLabelText(`1 unread in ${picker.sectionFeedback}`),
    ).not.toBeInTheDocument();
  });

  it("replaces the picker with a single explanation when nothing exists yet", async () => {
    await renderEntry({
      exams: [],
      tasks: [],
      assessments: [],
      feedback: EMPTY_TIMELINE,
      badgeRows: [LOCKED_BADGE],
    });

    expect(screen.getByText(picker.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /section/i })).not.toBeInTheDocument();
  });

  it("uses the touch sheet on the installed app", async () => {
    const user = userEvent.setup();
    await renderEntry({}, "pwa-mobile");

    await user.click(screen.getByRole("button", { name: /choose a section/i }));

    expect(screen.getByRole("dialog", { name: picker.sheetTitle })).toBeInTheDocument();
  });
});
