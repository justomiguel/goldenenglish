import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionnaireQuestionAddPanel } from "@/components/dashboard/admin/questionnaires/QuestionnaireQuestionAddPanel";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("QuestionnaireQuestionAddPanel", () => {
  it("renders type and prompt fields", () => {
    render(
      <QuestionnaireQuestionAddPanel
        locale="en"
        questionnaireId="q1"
        labels={dictEn.admin.questionnaires}
      />,
    );
    expect(screen.getByText(dictEn.admin.questionnaires.promptLabel)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.questionnaires.types.text)).toBeInTheDocument();
    expect(screen.getByText(dictEn.admin.questionnaires.previewTitle)).toBeInTheDocument();
  });
});
