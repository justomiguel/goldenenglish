import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const routerRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

const deleteRegistrationMock = vi.fn();
vi.mock("@/app/[locale]/dashboard/admin/registrations/actions", () => ({
  deleteRegistration: (...args: unknown[]) => deleteRegistrationMock(...args),
}));

const labels = dictEn.admin.registrations;

function makeRow(over: Partial<AdminRegistrationRow> = {}): AdminRegistrationRow {
  return {
    id: "1",
    first_name: "A",
    last_name: "B",
    dni: "1",
    email: "a@x.co",
    phone: "+1",
    birth_date: "2000-01-01",
    level_interest: "A1",
    status: "new",
    created_at: "2026-01-01T00:00:00.000Z",
    tutor_name: null,
    tutor_dni: null,
    tutor_email: null,
    tutor_phone: null,
    tutor_relationship: null,
    ...over,
  };
}

describe("useAdminRegistrationsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteRegistrationMock.mockResolvedValue({ ok: true });
  });

  it("maps statusLabel for known and unknown statuses", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows: [], labels }),
    );
    expect(result.current.statusLabel("new")).toBe(labels.new);
    expect(result.current.statusLabel("enrolled")).toBe(labels.enrolled);
    expect(result.current.statusLabel("contacted")).toBe(labels.contacted);
    expect(result.current.statusLabel("legacy")).toBe(labels.statusUnknown);
  });

  it("toggles sort direction when activating the same column", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows: [makeRow()], labels }),
    );
    expect(result.current.sortKey).toBe("received");
    expect(result.current.sortDir).toBe("desc");
    act(() => {
      result.current.toggleSort("received");
    });
    expect(result.current.sortDir).toBe("asc");
    act(() => {
      result.current.toggleSort("received");
    });
    expect(result.current.sortDir).toBe("desc");
  });

  it("resets page to 1 when changing sort column while not on page 1", () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      makeRow({ id: `id-${i}`, email: `u${i}@x.co`, first_name: `N${i}` }),
    );
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows, labels }),
    );
    act(() => {
      result.current.setPage(2);
    });
    expect(result.current.page).toBe(2);
    act(() => {
      result.current.toggleSort("email");
    });
    expect(result.current.page).toBe(1);
    expect(result.current.sortKey).toBe("email");
  });

  it("setFilterQueryAndResetPage forces page back to 1", () => {
    const rows = Array.from({ length: 30 }, (_, i) => makeRow({ id: `id-${i}` }));
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows, labels }),
    );
    act(() => {
      result.current.setPage(2);
    });
    act(() => {
      result.current.setFilterQueryAndResetPage("needle");
    });
    expect(result.current.page).toBe(1);
  });

  it("uses noFilterResults when query yields no rows", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({
        locale: "es",
        rows: [makeRow({ email: "only@x.co" })],
        labels,
      }),
    );
    act(() => {
      result.current.setFilterQueryAndResetPage("zzz");
    });
    expect(result.current.listEmpty).toBe(true);
    expect(result.current.emptyMessage).toBe(labels.noFilterResults);
  });

  it("uses none when list is empty without active filter", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows: [], labels }),
    );
    expect(result.current.listEmpty).toBe(true);
    expect(result.current.emptyMessage).toBe(labels.none);
  });

  it("onConfirmDelete succeeds and refreshes", async () => {
    const r = makeRow({ id: "rid" });
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows: [r], labels }),
    );
    act(() => {
      result.current.setDeleteRow(r);
    });
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(deleteRegistrationMock).toHaveBeenCalledWith("es", "rid");
    expect(result.current.toast).toBe(labels.deleteSuccess);
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("onConfirmDelete surfaces server message", async () => {
    deleteRegistrationMock.mockResolvedValueOnce({ ok: false, message: "db" });
    const r = makeRow({ id: "x1" });
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows: [r], labels }),
    );
    act(() => {
      result.current.setDeleteRow(r);
    });
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(result.current.toast).toContain(labels.deleteError);
    expect(result.current.toast).toContain("db");
  });

  it("onConfirmDelete is a no-op when no row is selected", async () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows: [makeRow()], labels }),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(deleteRegistrationMock).not.toHaveBeenCalled();
  });

  it("refreshList calls router.refresh", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ locale: "es", rows: [makeRow()], labels }),
    );
    act(() => {
      result.current.refreshList();
    });
    expect(routerRefresh).toHaveBeenCalled();
  });
});
