import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionnaireAdminListScreen } from "@/components/dashboard/admin/questionnaires/QuestionnaireAdminListScreen";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/settings/questionnaires",
}));

describe("QuestionnaireAdminListScreen", () => {
  it("shows the empty state and create control", () => {
    render(
      <QuestionnaireAdminListScreen locale="en" rows={[]} labels={dictEn.admin.questionnaires} />,
    );
    expect(screen.getByText(dictEn.admin.questionnaires.empty)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dictEn.admin.questionnaires.create })).toBeInTheDocument();
  });
});
