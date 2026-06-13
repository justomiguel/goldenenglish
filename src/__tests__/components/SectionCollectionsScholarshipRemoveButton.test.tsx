import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SectionCollectionsScholarshipRemoveButton } from "@/components/dashboard/admin/finance/SectionCollectionsScholarshipRemoveButton";
import { dictEn } from "@/test/dictEn";

const mockRefresh = vi.fn();
const mockDeactivate = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock(
  "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship",
  () => ({
    deactivateStudentScholarship: (...args: unknown[]) => mockDeactivate(...args),
  }),
);

describe("SectionCollectionsScholarshipRemoveButton", () => {
  it("deactivates the scholarship and refreshes on success", async () => {
    mockDeactivate.mockResolvedValue({ ok: true });
    const onNotice = vi.fn();
    const user = userEvent.setup();

    render(
      <SectionCollectionsScholarshipRemoveButton
        locale="en"
        sectionId="00000000-0000-4000-8000-000000000001"
        studentId="00000000-0000-4000-8000-000000000099"
        scholarshipId="00000000-0000-4000-8000-000000000010"
        labels={dictEn.admin.billing}
        onNotice={onNotice}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: dictEn.admin.billing.removeScholarship }),
    );

    await waitFor(() => {
      expect(mockDeactivate).toHaveBeenCalledWith({
        locale: "en",
        studentId: "00000000-0000-4000-8000-000000000099",
        sectionId: "00000000-0000-4000-8000-000000000001",
        scholarshipId: "00000000-0000-4000-8000-000000000010",
      });
    });
    expect(onNotice).toHaveBeenCalledWith(dictEn.admin.billing.saved);
    expect(mockRefresh).toHaveBeenCalled();
  });
});
