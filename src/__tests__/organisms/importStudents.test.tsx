import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { ImportStudents } from "@/components/organisms/ImportStudents";

const bulkImport = vi.hoisted(() => vi.fn());
const parseCsv = vi.hoisted(() => vi.fn());

vi.mock("papaparse", () => ({
  default: {
    parse: (...args: unknown[]) => parseCsv(...args),
  },
}));

vi.mock("@/app/[locale]/dashboard/admin/import/actions", () => ({
  bulkImportStudentsFromRows: bulkImport,
}));

describe("ImportStudents", () => {
  const labels = dictEn.admin.import;

  beforeEach(() => {
    parseCsv.mockReset();
    bulkImport.mockReset();
    bulkImport.mockResolvedValue({
      processed: 1,
      createdUsers: 1,
      enrolled: 1,
      paymentsSeeded: 12,
      results: [{ ok: true, rowIndex: 2, message: "" }],
    });
  });

  it("shows parse errors from Papa", async () => {
    parseCsv.mockReturnValue({
      data: [],
      errors: [{ message: "bad csv" }],
      meta: {} as never,
    } as never);
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    const file = new File(["x"], "x.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText(labels.parseError)).toBeInTheDocument();
    });
  });

  it("handles no rows after mapping", async () => {
    parseCsv.mockReturnValue({
      data: [{}],
      errors: [],
      meta: {} as never,
    } as never);
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["h\n"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.noRows)).toBeInTheDocument();
    });
  });

  it("shows validation error from Zod", async () => {
    parseCsv.mockReturnValue({
      data: [
        {
          first_name: "A",
          last_name: "B",
          dni: "1",
          academic_year: "1990",
        },
      ],
      errors: [],
      meta: {} as never,
    } as never);
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.validationError)).toBeInTheDocument();
    });
  });

  it("shows summary and row failures from import", async () => {
    parseCsv.mockReturnValue({
      data: [
        mappedRow(),
      ],
      errors: [],
      meta: {} as never,
    } as never);
    bulkImport.mockResolvedValue({
      processed: 1,
      createdUsers: 0,
      enrolled: 0,
      paymentsSeeded: 0,
      results: [{ ok: false, rowIndex: 3, message: "dup" }],
    });
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(new RegExp(labels.done))).toBeInTheDocument();
      expect(screen.getByText(/Row 3/)).toBeInTheDocument();
    });
  });

  it("shows summary only when all rows succeed", async () => {
    parseCsv.mockReturnValue({
      data: [mappedRow()],
      errors: [],
      meta: {} as never,
    } as never);
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(new RegExp(labels.done))).toBeInTheDocument();
    });
    expect(document.querySelector("pre")).toBeNull();
  });

  it("surfaces generic errors", async () => {
    parseCsv.mockImplementation(() => {
      throw new Error("boom");
    });
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv")] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.genericError)).toBeInTheDocument();
    });
  });

  it("does nothing when no file is chosen", () => {
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows generic detail when throw is not an Error", async () => {
    parseCsv.mockImplementation(() => {
      throw "plain";
    });
    render(<ImportStudents labels={labels} />);
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "x.csv", { type: "text/csv" })] },
    });
    await waitFor(() => {
      expect(screen.getByText(labels.genericError)).toBeInTheDocument();
      expect(document.querySelector("pre")?.textContent).toBe("Error");
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
