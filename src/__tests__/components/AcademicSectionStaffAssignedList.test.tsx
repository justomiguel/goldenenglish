/** @vitest-environment jsdom */
// REGRESSION CHECK: Teachers-tab assigned summary must show person cards with profile links; externals stay unlinked.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionStaffAssignedList } from "@/components/molecules/AcademicSectionStaffAssignedList";
import type { SectionStaffAssignedPerson } from "@/lib/academics/sectionStaffAssignedPerson";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

const dict = {
  heading: "Assigned now",
  leadBadge: "Lead",
  assistantBadge: "Asst.",
  assistantBadgeTeacher: "Teacher",
  assistantBadgeStudent: "Student",
  assistantBadgePortalAssistant: "Assistant (staff)",
  externalBadge: "External",
  empty: "Nobody assigned.",
  openProfileAria: "Open profile for {name}",
  phoneLabel: "Phone",
  documentLabel: "Document",
  emailLabel: "Email",
};

const lead: SectionStaffAssignedPerson = {
  id: "u-lead",
  label: "Vargas, Justo",
  kind: "lead",
  role: "teacher",
  phone: "+54911",
  dniOrPassport: "30111222",
  email: "justo@example.com",
  avatarDisplayUrl: "https://cdn.example/a.png",
};

describe("AcademicSectionStaffAssignedList", () => {
  it("renders empty copy when nobody is assigned", () => {
    render(
      <AcademicSectionStaffAssignedList
        locale="en"
        people={[]}
        externalLabels={[]}
        dict={dict}
      />,
    );
    expect(screen.getByText(dict.empty)).toBeVisible();
  });

  it("links portal staff cards to admin profile and shows personal fields", () => {
    render(
      <AcademicSectionStaffAssignedList
        locale="en"
        people={[lead]}
        externalLabels={["Guest One"]}
        dict={dict}
      />,
    );

    const profileLink = screen.getByRole("link", { name: "Open profile for Vargas, Justo" });
    expect(profileLink).toHaveAttribute("href", "/en/dashboard/admin/users/u-lead");
    expect(screen.getByText("Vargas, Justo")).toBeVisible();
    expect(screen.getByText(dict.leadBadge)).toBeVisible();
    expect(screen.getByText("+54911")).toBeVisible();
    expect(screen.getByText("30111222")).toBeVisible();
    expect(screen.getByText("justo@example.com")).toBeVisible();
    expect(screen.getByAltText("Vargas, Justo")).toHaveAttribute("src", "https://cdn.example/a.png");

    expect(screen.getByText("Guest One")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Guest One/i })).not.toBeInTheDocument();
  });
});
