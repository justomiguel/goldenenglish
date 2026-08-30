/** @vitest-environment jsdom */
// REGRESSION CHECK: First guardian shows link tools immediately; extra guardians open from "Add tutor".
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const existingTutor = {
  tutorId: "t-1",
  displayName: "Aguilar Arturo",
  emailDisplay: "a@example.com",
  relationshipCode: "father" as const,
};

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

  it("shows search/hint link tools and Add tutor when no guardian is linked", () => {
    render(<AdminUserDetailTutorCard {...baseProps} tutorLinks={[]} />);
    expect(screen.getByText(labels.detailTutorLinkHint)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.detailTutorAddOpen })).toBeInTheDocument();
  });

  it("shows linked guardian and an Add tutor button when a guardian exists", () => {
    render(<AdminUserDetailTutorCard {...baseProps} tutorLinks={[existingTutor]} />);
    expect(screen.getByText("Aguilar Arturo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.detailTutorAddOpen })).toBeInTheDocument();
    expect(screen.queryByText(labels.detailTutorLinkHint)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.detailTutorSave })).not.toBeInTheDocument();
  });

  it("opens the add-tutor panel so another guardian can be linked", async () => {
    const user = userEvent.setup();
    render(<AdminUserDetailTutorCard {...baseProps} tutorLinks={[existingTutor]} />);
    await user.click(screen.getByRole("button", { name: labels.detailTutorAddOpen }));
    expect(screen.getByText(labels.detailTutorLinkHint)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.detailTutorSave })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.detailTutorCreateOpen })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.detailTutorAddOpen })).toBeInTheDocument();
  });

  it("hides add-tutor controls when the ficha is read-only", () => {
    render(
      <AdminUserDetailTutorCard {...baseProps} editable={false} tutorLinks={[existingTutor]} />,
    );
    expect(screen.getByText("Aguilar Arturo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.detailTutorAddOpen })).not.toBeInTheDocument();
    expect(screen.queryByText(labels.detailTutorLinkHint)).not.toBeInTheDocument();
  });
});
