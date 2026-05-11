import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminUserDetailTutorFamilyStudentRow } from "@/components/molecules/AdminUserDetailTutorFamilyStudentRow";
import { dictEn } from "@/test/dictEn";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("AdminUserDetailTutorFamilyStudentRow", () => {
  it("shows revoked badge when financial access is inactive", () => {
    render(
      <ul>
        <AdminUserDetailTutorFamilyStudentRow
          locale="en"
          student={{
            studentId: "00000000-0000-4000-8000-000000000001",
            displayName: "Student Test",
            emailDisplay: "s@test.com",
            isMinor: true,
            financialAccessActive: false,
            relationshipCode: "mother",
          }}
          relationshipLabel={dictEn.admin.users.detailTutorRelationshipMother}
          labels={dictEn.admin.users}
          editable
          rowBusyGlobal={false}
          onRequestUnlink={() => {}}
        />
      </ul>,
    );

    expect(screen.getByText(dictEn.admin.users.detailTutorFamilyFinancialRevokedBadge)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(dictEn.admin.users.detailTutorFamilyOpenStudentProfile) })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/users/00000000-0000-4000-8000-000000000001",
    );
  });
});
