import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { ImportStudents } from "@/components/organisms/ImportStudents";
import { IMPORT_JOB_CANCELLED_BY_USER } from "@/lib/import/importJobErrorCodes";
import { IMPORT_PARSE_CSV_FAILED } from "@/lib/import/parseImportErrorCodes";
import { IMPORT_ROW_ENROLLMENT_FAILED } from "@/lib/import/importResultMessageCodes";

// REGRESSION CHECK: The fallback import path (without KV) must keep the same popup-based
// long-job UX as async jobs; otherwise users only see inline legend text and lose focus.
const bulkImport = vi.hoisted(() => vi.fn());
const parseImportFile = vi.hoisted(() => vi.fn());
const fetchMock = vi.hoisted(() => vi.fn());
const pollUntilDone = vi.hoisted(() => vi.fn());
const resetLongJob = vi.hoisted(() => vi.fn());

vi.mock("@/lib/import/parseImportFile", () => ({
  parseImportFile: (...args: unknown[]) => parseImportFile(...args),
}));

vi.mock("@/app/[locale]/dashboard/admin/import/actions", () => ({
  bulkImportStudentsFromRows: bulkImport,
}));

vi.mock("@/hooks/useLongJobPoll", () => ({
  useLongJobPoll: () => ({
    liveLine: null,
    jobSnapshot: null,
    reset: resetLongJob,
    pollUntilDone,
  }),
}));

describe("ImportStudents", () => {
  const labels = dictEn.admin.import;

  beforeEach(() => {
    parseImportFile.mockReset();
    bulkImport.mockReset();
    fetchMock.mockReset();
    pollUntilDone.mockReset();
    resetLongJob.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: false, code: "kv_not_configured" }),
    });
    pollUntilDone.mockResolvedValue({ status: "done" });
    vi.stubGlobal("fetch", fetchMock);
    bulkImport.mockResolvedValue({
      processed: 1,
      createdUsers: 1,
      enrolled: 1,
      paymentsSeeded: 12,
      profilesUpdated: 0,
      skippedNoop: 0,
      results: [{ ok: true, rowIndex: 2, message: "" }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows parse errors from file reader", async () => {
    parseImportFile.mockResolvedValue({
      data: [],
      errors: [{ message: IMPORT_PARSE_CSV_FAILED }],
    });
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    const file = new File(["x"], "x.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(labels.parseError)).toBeInTheDocument();
      expect(document.querySelector("pre")?.textContent).toBe(labels.parseCsvFailed);
    });
  });

  it("handles no rows after mapping", async () => {
    parseImportFile.mockResolvedValue({
      data: [{}],
      errors: [],
    });
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["h\n"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.noRows)).toBeInTheDocument();
    });
  });

  it("shows validation error from Zod", async () => {
    parseImportFile.mockResolvedValue({
      data: [
        {
          first_name: "A",
          last_name: "B",
          dni: "1",
          academic_year: "1990",
        },
      ],
      errors: [],
    });
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.validationError)).toBeInTheDocument();
    });
  });

  it("shows summary and row failures from import", async () => {
    parseImportFile.mockResolvedValue({
      data: [mappedRow()],
      errors: [],
    });
    bulkImport.mockResolvedValue({
      processed: 1,
      createdUsers: 0,
      enrolled: 0,
      paymentsSeeded: 0,
      profilesUpdated: 0,
      skippedNoop: 0,
      results: [{ ok: false, rowIndex: 3, message: IMPORT_ROW_ENROLLMENT_FAILED }],
    });
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(new RegExp(labels.done))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${labels.row} 3`))).toBeInTheDocument();
      expect(document.querySelector("pre")?.textContent).toContain(
        labels.rowResultEnrollmentFailed,
      );
    });
  });

  it("shows summary only when all rows succeed", async () => {
    parseImportFile.mockResolvedValue({
      data: [mappedRow()],
      errors: [],
    });
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(new RegExp(labels.done))).toBeInTheDocument();
    });
    expect(document.querySelector("pre")).toBeNull();
  });

  it("opens the activity popup while sync fallback import is running", async () => {
    parseImportFile.mockResolvedValue({
      data: [mappedRow()],
      errors: [],
    });
    let resolveImport: ((value: unknown) => void) | null = null;
    const importDone = new Promise((resolve) => {
      resolveImport = resolve;
    });
    bulkImport.mockReturnValue(importDone);
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(document.querySelector("dialog[open]")).not.toBeNull();
    });
    resolveImport?.({
      processed: 1,
      createdUsers: 1,
      enrolled: 1,
      paymentsSeeded: 12,
      profilesUpdated: 0,
      skippedNoop: 0,
      results: [{ ok: true, rowIndex: 2, message: "" }],
    });
    await waitFor(() => {
      expect(screen.getByText(labels.activityModalClose)).toBeInTheDocument();
    });
  });

  it("surfaces generic errors", async () => {
    parseImportFile.mockRejectedValue(new Error("boom"));
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.genericError)).toBeInTheDocument();
    });
  });

  it("shows cancelled status when admin stops the running job", async () => {
    parseImportFile.mockResolvedValue({
      data: [mappedRow()],
      errors: [],
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, jobId: "11111111-1111-1111-1111-111111111111" }),
    });
    pollUntilDone.mockResolvedValueOnce({
      status: "error",
      error: IMPORT_JOB_CANCELLED_BY_USER,
    });
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File(["x"], "x.csv")] } });
    await waitFor(() => {
      expect(screen.getByText(labels.importCancelledTitle)).toBeInTheDocument();
      expect(document.querySelector("pre")?.textContent).toBe(labels.importCancelledByUser);
    });
  });

  it("does nothing when no file is chosen", () => {
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows generic detail when throw is not an Error", async () => {
    parseImportFile.mockRejectedValue("plain");
    render(<ImportStudents locale="es" labels={labels} emptyLogPlaceholder="—" />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv", { type: "text/csv" })] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.genericError)).toBeInTheDocument();
      expect(document.querySelector("pre")?.textContent).toBe(labels.unknownError);
    });
  });
});

function mappedRow(): Record<string, string> {
  return {
    first_name: "A",
    last_name: "B",
    dni: "12345678",
    birth_date: "2010-01-02",
    nivel: "A1",
  };
}
