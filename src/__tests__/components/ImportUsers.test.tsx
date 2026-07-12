import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImportUsers } from "@/components/organisms/ImportUsers";

const dryRun = vi.fn();
const apply = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/users/import",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/importUsersActions", () => ({
  dryRunImportUsersAction: (...args: unknown[]) => dryRun(...args),
  applyImportUsersAction: (...args: unknown[]) => apply(...args),
}));

const labels = {
  exportTitle: "Export",
  exportLead: "Lead",
  modeLabel: "Mode",
  modeTemplate: "Template",
  modeData: "Data",
  scopeLabel: "Scope",
  scopeFilter: "Filter",
  scopeAll: "All",
  scopeSelectedHint: "{{count}} selected",
  download: "Download",
  cancel: "Cancel",
  exportUsers: "Export users",
  exportUsersAria: "Export aria",
  errorForbidden: "Forbidden",
  errorExportFailed: "Export failed",
  errorTooManyRows: "Too many",
  importTitle: "Import users",
  importLead: "Upload Excel",
  chooseFile: "Choose Excel file",
  chooseFileAria: "Choose file aria",
  previewTitle: "Preview",
  previewBody: "New: {{newCount}}. Dup: {{duplicateCount}}. Bad: {{invalidCount}}.",
  updateDuplicatesLabel: "Duplicates",
  updateDuplicatesYes: "Update",
  updateDuplicatesNo: "Leave",
  confirmApply: "OK — apply",
  resultTitle: "Result",
  resultBody: "C:{{created}} U:{{updated}} S:{{skipped}} F:{{failed}}",
  resultClose: "OK",
  errorNoFile: "No file",
  errorMissingHeaders: "Missing {{missing}}",
  errorParseFailed: "Parse failed",
  errorValidation: "Invalid",
  errorApplyFailed: "Apply failed",
  busyDryRun: "Checking…",
  busyApply: "Applying…",
};

// REGRESSION CHECK: Import must preview before apply; wrong format surfaces as error.
describe("ImportUsers", () => {
  beforeEach(() => {
    dryRun.mockReset();
    apply.mockReset();
  });

  it("shows dry-run error when format is invalid", async () => {
    const user = userEvent.setup();
    dryRun.mockResolvedValue({ ok: false, message: "Missing role" });
    render(<ImportUsers locale="en" labels={labels} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "bad.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(input, file);
    expect(await screen.findByRole("alert")).toHaveTextContent("Missing role");
  });

  it("opens preview modal after successful dry-run", async () => {
    const user = userEvent.setup();
    dryRun.mockResolvedValue({
      ok: true,
      newCount: 2,
      duplicateCount: 1,
      invalidCount: 0,
      payload: { newRows: [], duplicateRows: [] },
    });
    render(<ImportUsers locale="en" labels={labels} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "users.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    await user.upload(input, file);
    expect(await screen.findByText(/New: 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /OK — apply/i })).toBeInTheDocument();
  });
});
