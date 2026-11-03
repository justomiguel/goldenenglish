/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcademicSectionDeliveryModeForm } from "@/components/organisms/AcademicSectionDeliveryModeForm";

const { refresh, saveMode } = vi.hoisted(() => ({
  refresh: vi.fn(),
  saveMode: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionDeliveryActions", () => ({
  saveAcademicSectionDeliveryModeAction: (...args: unknown[]) => saveMode(...args),
}));

const dict = {
  title: "How the class meets",
  inPerson: "In person",
  hybrid: "Hybrid",
  remote: "Remote",
  missingKey: "The Daily key is missing on the institute record.",
  failedSlot: "The room for {day} {time} could not be prepared.",
  save: "Save mode",
};

describe("AcademicSectionDeliveryModeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides the radio group when the plan is gestion", () => {
    render(
      <AcademicSectionDeliveryModeForm
        locale="en"
        sectionId="section-1"
        plan="gestion"
        mode="in_person"
        credentialsReady
        dict={dict}
      />,
    );

    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("shows the three mode radios and no Daily notice for in-person ecosistema", () => {
    render(
      <AcademicSectionDeliveryModeForm
        locale="en"
        sectionId="section-1"
        plan="ecosistema"
        mode="in_person"
        credentialsReady
        dict={dict}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: dict.title })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: dict.inPerson })).toBeChecked();
    expect(screen.getByRole("radio", { name: dict.hybrid })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: dict.remote })).toBeInTheDocument();
    expect(screen.queryByText(dict.missingKey)).not.toBeInTheDocument();
  });

  it("shows the missing-key text for remote ecosistema without Daily credentials", () => {
    render(
      <AcademicSectionDeliveryModeForm
        locale="en"
        sectionId="section-1"
        plan="ecosistema"
        mode="remote"
        credentialsReady={false}
        dict={dict}
      />,
    );

    expect(screen.getByText(dict.missingKey)).toBeInTheDocument();
  });
});
