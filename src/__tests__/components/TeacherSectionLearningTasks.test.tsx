import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeacherSectionLearningTasks } from "@/components/teacher/TeacherSectionLearningTasks";
import { assignTemplateToSectionAction } from "@/app/[locale]/dashboard/teacher/tasks/actions";
import { dictEn } from "@/test/dictEn";
import { mockRefresh } from "@/test/navigationMock";

vi.mock("@/app/[locale]/dashboard/teacher/tasks/actions", () => ({
  assignTemplateToSectionAction: vi.fn(),
}));

const labels = dictEn.dashboard.teacherMySections;

describe("TeacherSectionLearningTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefresh.mockClear();
  });

  it("refreshes after assigning a template to the section", async () => {
    vi.mocked(assignTemplateToSectionAction).mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <TeacherSectionLearningTasks
        locale="en"
        sectionId="section-1"
        templates={[{ id: "tpl-1", title: "Homework", description: null, updatedAt: null }]}
        tasks={[]}
        labels={labels}
      />,
    );

    await user.type(screen.getByLabelText(labels.taskAssignStart), "2026-06-01T10:00");
    await user.type(screen.getByLabelText(labels.taskAssignDue), "2026-06-08T10:00");
    await user.click(screen.getByRole("button", { name: labels.taskAssignButton }));

    await waitFor(() => {
      expect(assignTemplateToSectionAction).toHaveBeenCalled();
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
