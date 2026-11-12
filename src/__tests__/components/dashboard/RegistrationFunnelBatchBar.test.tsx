import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistrationFunnelBatchBar } from "@/components/molecules/RegistrationFunnelBatchBar";
import { RegistrationSelectionHeader } from "@/components/molecules/RegistrationPageCheckbox";
import { useRegistrationPageSelection } from "@/hooks/useRegistrationPageSelection";
import { dictEn } from "@/test/dictEn";

const apply = vi.hoisted(() => vi.fn(async () => ({ ok: true, updated: 2, failed: 0 })));
vi.mock("@/app/[locale]/dashboard/admin/registrations/applyRegistrationFunnelBatchAction", () => ({
  applyRegistrationFunnelBatchAction: (...args: unknown[]) => apply(...args),
}));

const labels = dictEn.admin.registrations.funnel;

describe("useRegistrationPageSelection", () => {
  it("marks the visible page and clears it on the next page", () => {
    const { result, rerender } = renderHook(
      ({ pageKey, ids }: { pageKey: string; ids: string[] }) =>
        useRegistrationPageSelection(pageKey, ids),
      { initialProps: { pageKey: "registered:1", ids: ["a", "b"] } },
    );
    act(() => result.current.togglePage());
    expect(result.current.selectedIds).toEqual(["a", "b"]);
    act(() => result.current.togglePage());
    expect(result.current.selectedIds).toEqual([]);
    act(() => result.current.toggle("a"));
    rerender({ pageKey: "registered:2", ids: ["c"] });
    expect(result.current.selectedIds).toEqual([]);
  });
});

describe("RegistrationFunnelBatchBar", () => {
  it("stays disabled until a row is marked, then sends only those ids", async () => {
    const { rerender } = render(
      <RegistrationFunnelBatchBar
        locale="en"
        stage="registered"
        labels={labels}
        selectedIds={[]}
        allMarked={false}
        pageHasRows
        onTogglePage={() => {}}
        onClear={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: labels.markPage })).toBeDisabled();

    rerender(
      <RegistrationFunnelBatchBar
        locale="en"
        stage="registered"
        labels={labels}
        selectedIds={["id-1", "id-2"]}
        allMarked={false}
        pageHasRows
        onTogglePage={() => {}}
        onClear={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: labels.markPage }));
    fireEvent.click(screen.getByRole("button", { name: labels.batchConfirm }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(apply).toHaveBeenCalledWith({
      locale: "en",
      stage: "registered",
      registrationIds: ["id-1", "id-2"],
    });
  });

  it("uses a mixed header checkbox when only part of the page is marked", () => {
    render(
      <table>
        <thead>
          <tr>
            <RegistrationSelectionHeader
              label={labels.selectPage}
              selection={{
                pageIds: ["a", "b"],
                selectedIds: ["a"],
                allMarked: false,
                someMarked: true,
                toggle: () => {},
                togglePage: () => {},
                clear: () => {},
              }}
            />
          </tr>
        </thead>
      </table>,
    );
    expect(screen.getByRole("checkbox", { name: labels.selectPage })).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });
});
