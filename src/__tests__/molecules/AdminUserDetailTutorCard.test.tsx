/** @vitest-environment jsdom */
// REGRESSION CHECK: Link/search UI only when no guardians; linked tutors stay visible in the list above.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminUserDetailTutorCard } from "@/components/molecules/AdminUserDetailTutorCard";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/adminUserDetailActions", () => ({
  searchAdminParentsForDetailAction: vi.fn().mockResolvedValue([]),
  removeAdminStudentTutorLinkAction: vi.fn(),
  upsertAdminStudentTutorLinkAction: vi.fn(),
}));

const labels = dictEn.admin.users;

const baseProps = {
  locale: "en",
  studentId: "stu-1",
  isMinor: false,
  labels,
  editable: true,
  onFeedback: vi.fn(),
};

describe("AdminUserDetailTutorCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows search/hint link tools only when no guardian is linked", () => {
    render(<AdminUserDetailTutorCard {...baseProps} tutorLinks={[]} />);
    expect(screen.getByText(labels.detailTutorLinkHint)).toBeInTheDocument();
  });

  it("shows linked guardian in list and hides link tools when a guardian exists", () => {
    render(
      <AdminUserDetailTutorCard
        {...baseProps}
        tutorLinks={[
          {
            tutorId: "t-1",
            displayName: "Aguilar Arturo",
            emailDisplay: "a@example.com",
            relationshipCode: "father",
          },
        ]}
      />,
    );
    expect(screen.getByText("Aguilar Arturo")).toBeInTheDocument();
    expect(screen.queryByText(labels.detailTutorLinkHint)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.detailTutorSave })).not.toBeInTheDocument();
  });
});
