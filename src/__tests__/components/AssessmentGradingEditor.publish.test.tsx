import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentGradingEditor } from "@/components/molecules/AssessmentGradingEditor";
import { mockRefresh } from "@/test/navigationMock";
import type { Dictionary } from "@/types/i18n";
import type { AssessmentMatrixRosterRow } from "@/types/assessmentGrades";
import type { RubricDimensionDef } from "@/types/rubricDimensions";

// REGRESSION CHECK: Publish-only must save status published and must not call the email action.

const { upsertGradeAction, publishGradeWithNotification } = vi.hoisted(() => ({
  upsertGradeAction: vi.fn(),
  publishGradeWithNotification: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/teacher/sections/assessmentGradeActions", () => ({
  upsertGradeAction,
  publishGradeWithNotification,
}));

const dict = {
  saveDraft: "Save draft",
  publish: "Publish the grade only",
  publishHelp: "Visible in the portal. No email is sent.",
  publishNotify: "Publish and email guardians",
  publishNotifyHelp: "Visible in the portal. Each guardian gets an email.",
  close: "Close",
  errorValidation: "Check the fields.",
  errorForbidden: "Not allowed.",
  errorAuth: "Session expired.",
  errorScoreCap: "Score is too high.",
  errorSave: "Could not save.",
  rubric: {
    scoreLabel: "Score",
    autoHint: "Suggested: {value}",
    syncFromRubric: "Match the rubric",
    feedbackLabel: "Teacher comment",
  },
  chips: { aria: "Quick phrases", phrases: [] },
} as Dictionary["dashboard"]["teacherAssessmentMatrix"];

const dimensions: RubricDimensionDef[] = [
  { key: "speaking", label: "Speaking", scaleMin: 1, scaleMax: 10 },
];

const row: AssessmentMatrixRosterRow = {
  enrollmentId: "enr-1",
  studentLabel: "López Ana",
  gradeStatus: "draft",
  score: 8,
  rubric: { speaking: 8 },
  teacherFeedback: null,
};

function renderEditor() {
  const onSaved = vi.fn();
  render(
    <AssessmentGradingEditor
      locale="es"
      sectionId="sec-1"
      assessmentId="asm-1"
      maxScore={10}
      dimensions={dimensions}
      row={row}
      dict={dict}
      onClose={vi.fn()}
      onSaved={onSaved}
    />,
  );
  return { onSaved };
}

describe("AssessmentGradingEditor publish actions", () => {
  beforeEach(() => {
    upsertGradeAction.mockReset();
    publishGradeWithNotification.mockReset();
    upsertGradeAction.mockResolvedValue({ ok: true });
    publishGradeWithNotification.mockResolvedValue({ ok: true });
  });

  it("shows a publish-only button and a publish-and-email button", () => {
    renderEditor();

    expect(screen.getByRole("button", { name: /Publish the grade only/ })).toHaveAccessibleDescription(
      dict.publishHelp,
    );
    expect(screen.getByRole("button", { name: /Publish and email guardians/ })).toHaveAccessibleDescription(
      dict.publishNotifyHelp,
    );
  });

  it("publishes the grade without email when the silent button is pressed", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderEditor();

    await user.click(screen.getByRole("button", { name: /Publish the grade only/ }));

    expect(publishGradeWithNotification).not.toHaveBeenCalled();
    expect(upsertGradeAction).toHaveBeenCalledOnce();
    const formData = upsertGradeAction.mock.calls[0]?.[1] as FormData;
    expect(formData.get("gradeStatus")).toBe("published");
    expect(onSaved).toHaveBeenCalledWith("enr-1", "published");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("emails guardians only from the notify button", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderEditor();

    await user.click(screen.getByRole("button", { name: /Publish and email guardians/ }));

    expect(upsertGradeAction).not.toHaveBeenCalled();
    expect(publishGradeWithNotification).toHaveBeenCalledOnce();
    expect(onSaved).toHaveBeenCalledWith("enr-1", "published");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
