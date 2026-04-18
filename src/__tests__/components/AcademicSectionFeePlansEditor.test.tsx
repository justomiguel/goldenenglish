/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionFeePlansEditor } from "@/components/organisms/AcademicSectionFeePlansEditor";
import type { SectionFeePlanWithUsage } from "@/types/sectionFeePlan";

const refresh = vi.fn();
const upsertSectionFeePlanAction = vi.fn();
const archiveSectionFeePlanAction = vi.fn();
const restoreSectionFeePlanAction = vi.fn();
const deleteSectionFeePlanAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionFeePlanActions", () => ({
  upsertSectionFeePlanAction: (...a: unknown[]) => upsertSectionFeePlanAction(...a),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionFeePlanLifecycleActions", () => ({
  archiveSectionFeePlanAction: (...a: unknown[]) => archiveSectionFeePlanAction(...a),
  restoreSectionFeePlanAction: (...a: unknown[]) => restoreSectionFeePlanAction(...a),
  deleteSectionFeePlanAction: (...a: unknown[]) => deleteSectionFeePlanAction(...a),
}));

const dict = {
  title: "Monthly fee plans",
  lead: "Lead",
  empty: "No fee plan defined yet.",
  add: "Add fee plan",
  create: "Create fee plan",
  save: "Save fee plan",
  edit: "Edit",
  editAria: "Edit fee plan",
  delete: "Delete",
  deleteAria: "Delete fee plan permanently",
  cancel: "Cancel",
  errorSave: "Could not save the fee plan. Try again.",
  errorInUse: "This plan already has student payments. Archive it instead of deleting.",
  effectiveFromMonth: "Effective from month",
  effectiveFromYear: "Effective from year",
  effectiveFromShort: "From",
  monthlyFee: "Monthly fee",
  currency: "Currency",
  currencyOther: "Other...",
  currencyOtherAria: "Custom currency code (ISO 4217)",
  prorateExplanation:
    "Months are prorated automatically based on the classes available to each student.",
  inUseBadge: "In use",
  inUseBadgeTitle: "Students already have payments under this plan.",
  archivedBadge: "Archived",
  archive: "Archive",
  archiveAria: "Archive fee plan",
  restore: "Restore",
  restoreAria: "Restore archived fee plan",
  duplicateVersion: "Duplicate as new version",
  duplicateVersionAria: "Duplicate this fee plan as a new effective-dated version",
  editingInUseWarning:
    "This plan already has student payments. Editing it will only affect future payments.",
  showArchived: "Show archived plans",
  hideArchived: "Hide archived plans",
} as const;

const planActiveUnused: SectionFeePlanWithUsage = {
  id: "plan-unused",
  sectionId: "sec",
  effectiveFromYear: 2026,
  effectiveFromMonth: 1,
  monthlyFee: 100,
  currency: "USD",
  archivedAt: null,
  inUse: false,
};

const planActiveInUse: SectionFeePlanWithUsage = {
  ...planActiveUnused,
  id: "plan-in-use",
  effectiveFromMonth: 3,
  monthlyFee: 120,
  inUse: true,
};

const planArchived: SectionFeePlanWithUsage = {
  ...planActiveUnused,
  id: "plan-archived",
  effectiveFromMonth: 6,
  archivedAt: "2026-04-01T00:00:00Z",
  inUse: false,
};

describe("AcademicSectionFeePlansEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // REGRESSION CHECK: planes en uso NO deben exponer el botón de hard delete;
  // la US pide preservar integridad referencial, por lo que el camino visible
  // debe ser Archivar.
  it("hides hard delete and shows archive for in-use plans", () => {
    render(
      <AcademicSectionFeePlansEditor
        locale="en"
        sectionId="sec"
        initialPlans={[planActiveInUse]}
        dict={dict}
      />,
    );
    expect(screen.getByLabelText("Archive fee plan")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delete fee plan permanently")).toBeNull();
    expect(screen.getByText("In use")).toBeInTheDocument();
  });

  it("shows hard delete (no archive) for unused plans", () => {
    render(
      <AcademicSectionFeePlansEditor
        locale="en"
        sectionId="sec"
        initialPlans={[planActiveUnused]}
        dict={dict}
      />,
    );
    expect(screen.getByLabelText("Delete fee plan permanently")).toBeInTheDocument();
    expect(screen.queryByLabelText("Archive fee plan")).toBeNull();
    expect(screen.queryByText("In use")).toBeNull();
  });

  it("archives a plan via the archive button", async () => {
    archiveSectionFeePlanAction.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <AcademicSectionFeePlansEditor
        locale="en"
        sectionId="sec"
        initialPlans={[planActiveInUse]}
        dict={dict}
      />,
    );
    await user.click(screen.getByLabelText("Archive fee plan"));
    await waitFor(() =>
      expect(archiveSectionFeePlanAction).toHaveBeenCalledWith({
        locale: "en",
        sectionId: "sec",
        planId: "plan-in-use",
      }),
    );
  });

  it("hides archived plans by default and reveals them via the toggle", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionFeePlansEditor
        locale="en"
        sectionId="sec"
        initialPlans={[planActiveUnused, planArchived]}
        dict={dict}
      />,
    );
    expect(screen.queryByText("Archived")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Show archived plans/ }));
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.getByLabelText("Restore archived fee plan")).toBeInTheDocument();
  });

  it("surfaces IN_USE error from the server when delete is rejected", async () => {
    deleteSectionFeePlanAction.mockResolvedValue({ ok: false, code: "IN_USE" });
    const user = userEvent.setup();
    render(
      <AcademicSectionFeePlansEditor
        locale="en"
        sectionId="sec"
        initialPlans={[planActiveUnused]}
        dict={dict}
      />,
    );
    await user.click(screen.getByLabelText("Delete fee plan permanently"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(dict.errorInUse),
    );
  });

  it("opens an editing form with the in-use warning when editing a plan with payments", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionFeePlansEditor
        locale="en"
        sectionId="sec"
        initialPlans={[planActiveInUse]}
        dict={dict}
      />,
    );
    await user.click(screen.getByLabelText("Edit fee plan"));
    expect(screen.getByText(/This plan already has student payments/)).toBeInTheDocument();
  });

  it("offers Duplicate as new version on in-use plans and prefills the create form", async () => {
    const user = userEvent.setup();
    render(
      <AcademicSectionFeePlansEditor
        locale="en"
        sectionId="sec"
        initialPlans={[planActiveInUse]}
        dict={dict}
      />,
    );
    await user.click(
      screen.getByLabelText("Duplicate this fee plan as a new effective-dated version"),
    );
    expect(screen.getByRole("button", { name: "Create fee plan" })).toBeInTheDocument();
  });
});
