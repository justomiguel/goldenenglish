// REGRESSION CHECK: Public register hides the section combo unless staff turn on show-all and two or more sections are open.
import { describe, expect, it } from "vitest";
import { REGISTRATION_UNDECIDED_FORM_VALUE } from "@/lib/register/registrationSectionConstants";
import {
  initialRegisterSelectedSectionIds,
  resolveRegisterAssignedSectionLabel,
  resolveRegisterSectionPickerView,
} from "@/lib/register/resolveRegisterSectionPickerView";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("resolveRegisterSectionPickerView", () => {
  it("hides the picker and uses the undecided sentinel when no section is open", () => {
    expect(resolveRegisterSectionPickerView({ choosableIds: [], showAllSections: true })).toEqual({
      showPicker: false,
      hiddenPreferredSectionId: REGISTRATION_UNDECIDED_FORM_VALUE,
    });
  });

  it("hides the picker and sends the only open section", () => {
    expect(
      resolveRegisterSectionPickerView({ choosableIds: [A], showAllSections: true }),
    ).toEqual({
      showPicker: false,
      hiddenPreferredSectionId: A,
    });
  });

  it("hides the picker and sends the first section when show-all is off", () => {
    expect(
      resolveRegisterSectionPickerView({ choosableIds: [A, B], showAllSections: false }),
    ).toEqual({
      showPicker: false,
      hiddenPreferredSectionId: A,
    });
  });

  it("shows the picker only when show-all is on and two or more sections are open", () => {
    expect(
      resolveRegisterSectionPickerView({ choosableIds: [A, B], showAllSections: true }),
    ).toEqual({
      showPicker: true,
      hiddenPreferredSectionId: A,
    });
  });
});

describe("initialRegisterSelectedSectionIds", () => {
  it("starts empty when the enrollment link owns the section", () => {
    expect(
      initialRegisterSelectedSectionIds({
        choosableIds: [A, B],
        showAllSections: false,
        hasEnrollmentLink: true,
      }),
    ).toEqual([]);
  });

  it("starts empty when the picker is visible", () => {
    expect(
      initialRegisterSelectedSectionIds({ choosableIds: [A, B], showAllSections: true }),
    ).toEqual([]);
  });

  it("starts with the hidden default when the picker is off", () => {
    expect(
      initialRegisterSelectedSectionIds({ choosableIds: [A, B], showAllSections: false }),
    ).toEqual([A]);
  });
});

describe("resolveRegisterAssignedSectionLabel", () => {
  const options = [
    { id: A, label: "2026 — B1 Morning" },
    { id: B, label: "2026 — B1 Afternoon" },
  ];

  it("returns the hidden section label when the combo is off", () => {
    expect(
      resolveRegisterAssignedSectionLabel({
        sectionOptions: options,
        hiddenPreferredSectionId: A,
        showPicker: false,
        hasEnrollmentLink: false,
      }),
    ).toBe("2026 — B1 Morning");
  });

  it("returns null when the combo is visible", () => {
    expect(
      resolveRegisterAssignedSectionLabel({
        sectionOptions: options,
        hiddenPreferredSectionId: A,
        showPicker: true,
        hasEnrollmentLink: false,
      }),
    ).toBeNull();
  });

  it("returns null when an enrollment link already names the section", () => {
    expect(
      resolveRegisterAssignedSectionLabel({
        sectionOptions: options,
        hiddenPreferredSectionId: A,
        showPicker: false,
        hasEnrollmentLink: true,
      }),
    ).toBeNull();
  });

  it("returns null when there is no open section", () => {
    expect(
      resolveRegisterAssignedSectionLabel({
        sectionOptions: [],
        hiddenPreferredSectionId: REGISTRATION_UNDECIDED_FORM_VALUE,
        showPicker: false,
        hasEnrollmentLink: false,
      }),
    ).toBeNull();
  });
});
