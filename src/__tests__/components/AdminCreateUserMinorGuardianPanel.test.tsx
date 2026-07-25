// REGRESSION CHECK: Create-minor guardian search must prefetch the empty-query
// list (parity with detail tutor linker) and expose dictionary-backed tooltip/heading.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminCreateUserMinorGuardianPanel } from "@/components/dashboard/AdminCreateUserMinorGuardianPanel";
import type { Dictionary } from "@/types/i18n";

const searchMock = vi.fn();

const labels = {
  createUserGuardianLegend: "Guardian",
  createUserGuardianLead: "Lead",
  createUserGuardianModeExisting: "Existing",
  createUserGuardianModeNew: "New",
  createUserGuardianSearchLabel: "Find guardian",
  createUserGuardianSearchPlaceholder: "Name…",
  createUserGuardianSearchMinChars: "Min chars",
  createUserGuardianSearchTooltip: "Tooltip for guardian search",
  createUserGuardianSearchResultsHeading: "Guardians available",
  createUserGuardianSelected: "Selected",
  detailTutorCreateDni: "DNI",
  detailTutorCreateFirstName: "First",
  detailTutorCreateLastName: "Last",
  detailTutorCreateEmail: "Email",
  detailTutorCreateEmailHint: "Hint",
  detailTutorCreatePhone: "Phone",
  detailTutorCreateRelationship: "Relationship",
  detailTutorCreateRelationshipHint: "Rel hint",
  detailTutorRelationshipLabel: "Rel",
  detailTutorRelationshipHint: "Hint",
  detailTutorRelationshipPlaceholder: "Pick",
  detailTutorRelationshipMother: "Mother",
  detailTutorRelationshipFather: "Father",
  detailTutorRelationshipLegalGuardian: "Guardian",
  detailTutorRelationshipOther: "Other",
} as unknown as Dictionary["admin"]["users"];

describe("AdminCreateUserMinorGuardianPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchMock.mockResolvedValue([{ id: "p1", label: "López Ana" }]);
  });

  it("prefetches parents when the existing-guardian search mounts empty", async () => {
    render(
      <AdminCreateUserMinorGuardianPanel
        labels={labels}
        guardianMode="existing"
        onGuardianModeChange={vi.fn()}
        onResetGuardianFields={vi.fn()}
        searchParents={searchMock}
        pickedGuardian={null}
        onPickGuardian={vi.fn()}
        guardianSearchKey={0}
        tutorDni=""
        onTutorDniChange={vi.fn()}
        tutorFirstName=""
        onTutorFirstNameChange={vi.fn()}
        tutorLastName=""
        onTutorLastNameChange={vi.fn()}
        tutorEmail=""
        onTutorEmailChange={vi.fn()}
        tutorPhone=""
        onTutorPhoneChange={vi.fn()}
        relationship=""
        onRelationshipChange={vi.fn()}
      />,
    );

    expect(screen.getByTitle("Tooltip for guardian search")).toBeInTheDocument();
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith("");
    });
    expect(await screen.findByText("Guardians available")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "López Ana" })).toBeInTheDocument();
  });
});
