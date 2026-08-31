import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionnaireResultsCharts } from "@/components/dashboard/admin/questionnaires/QuestionnaireResultsCharts";
import { dictEn } from "@/test/dictEn";

describe("QuestionnaireResultsCharts", () => {
  it("lists free-text answers and skips a chart series", () => {
    render(
      <QuestionnaireResultsCharts
        responseCount={1}
        labels={dictEn.admin.questionnaires}
        blocks={[
          {
            kind: "list",
            questionId: "t",
            prompt: "Comment",
            answeredCount: 1,
            percent: 100,
            values: ["great"],
          },
        ]}
      />,
    );
    expect(screen.getByText("Comment")).toBeInTheDocument();
    expect(screen.getByText("great")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
