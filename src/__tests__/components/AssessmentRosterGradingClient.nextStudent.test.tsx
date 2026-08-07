/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssessmentRosterGradingClient } from "@/components/organisms/AssessmentRosterGradingClient";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { AssessmentMatrixRosterRow } from "@/types/assessmentGrades";
import type { Dictionary } from "@/types/i18n";

const { mockUseAppSurface } = vi.hoisted(() => ({
  mockUseAppSurface: vi.fn<() => AppSurface>(),
}));

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

vi.mock("@/components/molecules/AssessmentGradingEditor", () => ({
  AssessmentGradingEditor: (props: {
    onSaved: (id: string, status: "draft" | "published") => void;
    row: { enrollmentId: string; studentLabel: string };
  }) => (
    <div data-testid="mock-editor">
      <span>{props.row.studentLabel}</span>
      <button type="button" onClick={() => props.onSaved(props.row.enrollmentId, "draft")}>
        mock-draft
      </button>
      <button type="button" onClick={() => props.onSaved(props.row.enrollmentId, "published")}>
        mock-publish
      </button>
    </div>
  ),
}));

const dict = {
  assessmentLead: "{name} · max {maxScore} · {date}",
  rosterTitle: "Students",
  studentColumn: "Student",
  statusColumn: "Status",
  evaluate: "Grade",
  evaluateAria: "Grade {student}",
  close: "Close",
  saveDraft: "Save draft",
  publish: "Publish",
  publishNotify: "Publish & email guardians",
  backdropCloseAria: "Close grading panel",
  statusPublished: "Published",
  statusDraft: "Draft",
  statusPending: "Not started",
  statusDotPublishedAria: "Published grade",
  statusDotDraftAria: "Draft grade",
  statusDotPendingAria: "No grade yet",
  legend: "Green: published. Amber: draft. Gray: not started.",
  errorAuth: "Session expired. Sign in again.",
  errorValidation: "Check the fields and try again.",
  errorForbidden: "You cannot grade this roster.",
  errorSave: "Could not save. Try again.",
  errorScoreCap: "Score is above the maximum for this assessment.",
  savedDraftOk: "Draft saved.",
  savedPublishedOk: "Grade published.",
  path: {
    stepCreate: "Create",
    stepStudent: "Student",
    stepGrade: "Grade",
    stepPublish: "Publish",
    countsLine: "{published} published · {draft} draft · {pending} pending",
    publishedNext: "Published · next {name}",
    allPublished: "Done: all published",
    stripAria: "Grading path",
  },
  rubric: {
    criteria: {},
    scoreLabel: "Final score",
    autoHint: "Suggested: {value}",
    missingHint: "Complete rubric scores.",
  },
} satisfies Dictionary["dashboard"]["teacherAssessmentMatrix"];

function row(
  enrollmentId: string,
  studentLabel: string,
  gradeStatus: AssessmentMatrixRosterRow["gradeStatus"],
): AssessmentMatrixRosterRow {
  return {
    enrollmentId,
    studentLabel,
    gradeStatus,
    score: null,
    rubric: {},
    teacherFeedback: null,
  };
}

function renderClient(rows: AssessmentMatrixRosterRow[]) {
  return render(
    <AssessmentRosterGradingClient
      locale="en"
      sectionId="section-1"
      assessmentId="assessment-1"
      assessmentName="Midterm"
      assessmentDateLabel="Aug 7"
      maxScore={100}
      dimensions={[]}
      rows={rows}
      dict={dict}
    />,
  );
}

function pathStep(name: string) {
  return screen.getByRole("listitem", { name });
}

describe("AssessmentRosterGradingClient next student flow", () => {
  beforeEach(() => {
    mockUseAppSurface.mockReturnValue("pwa-mobile");
  });

  it("keeps a draft save on the current student without advancing", async () => {
    const user = userEvent.setup();
    renderClient([row("ana", "Ana", "published"), row("bruno", "Bruno", null), row("clara", "Clara", "draft")]);

    expect(screen.getByRole("list", { name: dict.path.stripAria })).toBeInTheDocument();
    expect(screen.getByText("1 published · 1 draft · 1 pending")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Grade Bruno" }));
    expect(screen.getByRole("dialog", { name: "Bruno · Midterm" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "mock-draft" }));

    expect(screen.getByText(dict.savedDraftOk)).toBeInTheDocument();
    expect(within(screen.getByTestId("mock-editor")).getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Bruno · Midterm" })).toBeInTheDocument();
  });

  it("publishes the current student and opens the next pending student", async () => {
    const user = userEvent.setup();
    renderClient([row("ana", "Ana", "published"), row("bruno", "Bruno", null), row("clara", "Clara", "draft")]);

    await user.click(screen.getByRole("button", { name: "Grade Bruno" }));
    await user.click(screen.getByRole("button", { name: "mock-publish" }));

    expect(screen.getByText("Published · next Clara")).toBeInTheDocument();
    expect(screen.getByText("2 published · 1 draft · 0 pending")).toBeInTheDocument();
    expect(pathStep(dict.path.stepPublish)).toHaveAttribute("data-path-state", "current");
    expect(within(screen.getByTestId("mock-editor")).getByText("Clara")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Clara · Midterm" })).toBeInTheDocument();
  });

  it("closes the shell and shows all-published when publishing the final pending student", async () => {
    const user = userEvent.setup();
    renderClient([row("ana", "Ana", "published"), row("bruno", "Bruno", "published"), row("clara", "Clara", "draft")]);

    await user.click(screen.getByRole("button", { name: "Grade Clara" }));
    await user.click(screen.getByRole("button", { name: "mock-publish" }));

    expect(screen.getByText(dict.path.allPublished)).toBeInTheDocument();
    expect(screen.getByText("3 published · 0 draft · 0 pending")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-editor")).not.toBeInTheDocument();
  });
});
