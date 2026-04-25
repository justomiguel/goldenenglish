import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminStudentBillingScholarshipPanel } from "@/components/dashboard/AdminStudentBillingScholarshipPanel";
import { dictEn } from "@/test/dictEn";

const mockRefresh = vi.fn();
const mockCreateStudentScholarship = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock(
  "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship",
  () => ({
    createStudentScholarship: (...args: unknown[]) =>
      mockCreateStudentScholarship(...args),
    updateStudentScholarship: vi.fn(),
    deactivateStudentScholarship: vi.fn(),
  }),
);

describe("AdminStudentBillingScholarshipPanel", () => {
  it("lists every discounted month for an active scholarship", () => {
    render(
      <AdminStudentBillingScholarshipPanel
        locale="en"
        studentId="00000000-0000-4000-8000-000000000099"
        sectionId="00000000-0000-4000-8000-000000000001"
        sectionName="Section A"
        scholarships={[{
          id: "00000000-0000-4000-8000-000000000010",
          discount_percent: 100,
          note: null,
          valid_from_year: 2026,
          valid_from_month: 5,
          valid_until_year: 2026,
          valid_until_month: 7,
          is_active: true,
        }]}
        labels={dictEn.admin.billing}
        busy={false}
        setBusy={vi.fn()}
        setMsg={vi.fn()}
      />,
    );

    expect(screen.getByText("Discounted months")).toBeInTheDocument();
    expect(screen.getByText("05/2026 · 100% discount")).toBeInTheDocument();
    expect(screen.getByText("06/2026 · 100% discount")).toBeInTheDocument();
    expect(screen.getByText("07/2026 · 100% discount")).toBeInTheDocument();
  });

  it("shows the saved scholarship immediately after a successful save", async () => {
    mockCreateStudentScholarship.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <AdminStudentBillingScholarshipPanel
        locale="en"
        studentId="00000000-0000-4000-8000-000000000099"
        sectionId="00000000-0000-4000-8000-000000000001"
        sectionName="Section A"
        scholarships={[]}
        labels={dictEn.admin.billing}
        busy={false}
        setBusy={vi.fn()}
        setMsg={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText(dictEn.admin.billing.scholarshipPercent),
      "50",
    );
    await user.click(
      screen.getByRole("button", { name: dictEn.admin.billing.addScholarship }),
    );

    await waitFor(() => {
      expect(mockCreateStudentScholarship).toHaveBeenCalled();
    });
  });
});
