import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { useAdminRegistrationsList } from "@/hooks/useAdminRegistrationsList";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

const routerRefresh = vi.fn();
const routerReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh, replace: routerReplace }),
  usePathname: () => "/es/dashboard/admin/registrations",
  useSearchParams: () => new URLSearchParams(),
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

const baseParams = {
  locale: "es",
  totalCount: 1,
  page: 1,
  pageSize: 25,
  searchQuery: "",
  sortKey: "received" as const,
  sortDir: "desc" as const,
  labels,
};

describe("useAdminRegistrationsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteRegistrationMock.mockResolvedValue({ ok: true });
  });

  it("maps statusLabel for known and unknown statuses", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ ...baseParams, rows: [], totalCount: 0 }),
    );
    expect(result.current.statusLabel("new")).toBe(labels.new);
    expect(result.current.statusLabel("enrolled")).toBe(labels.enrolled);
    expect(result.current.statusLabel("contacted")).toBe(labels.contacted);
    expect(result.current.statusLabel("legacy")).toBe(labels.statusUnknown);
  });

  it("toggleSort pushes URL params via router.replace", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ ...baseParams, rows: [makeRow()] }),
    );
    act(() => {
      result.current.toggleSort("email");
    });
    expect(routerReplace).toHaveBeenCalled();
    const url = routerReplace.mock.calls[0][0] as string;
    expect(url).toContain("sort=email");
    expect(url).toContain("dir=asc");
  });

  it("setFilterQueryAndResetPage pushes q param via router.replace", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ ...baseParams, rows: [makeRow()] }),
    );
    act(() => {
      result.current.setFilterQueryAndResetPage("needle");
    });
    expect(routerReplace).toHaveBeenCalled();
    const url = routerReplace.mock.calls[0][0] as string;
    expect(url).toContain("q=needle");
  });

  it("uses noFilterResults when search yields no rows", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({
        ...baseParams,
        rows: [],
        totalCount: 0,
        searchQuery: "zzz",
      }),
    );
    expect(result.current.listEmpty).toBe(true);
    expect(result.current.emptyMessage).toBe(labels.noFilterResults);
  });

  it("uses none when list is empty without active filter", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ ...baseParams, rows: [], totalCount: 0 }),
    );
    expect(result.current.listEmpty).toBe(true);
    expect(result.current.emptyMessage).toBe(labels.none);
  });

  it("onConfirmDelete succeeds and refreshes", async () => {
    const r = makeRow({ id: "rid" });
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ ...baseParams, rows: [r] }),
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
      useAdminRegistrationsList({ ...baseParams, rows: [r] }),
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
      useAdminRegistrationsList({ ...baseParams, rows: [makeRow()] }),
    );
    await act(async () => {
      await result.current.onConfirmDelete();
    });
    expect(deleteRegistrationMock).not.toHaveBeenCalled();
  });

  it("refreshList calls router.refresh", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ ...baseParams, rows: [makeRow()] }),
    );
    act(() => {
      result.current.refreshList();
    });
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("setPage pushes page param via router.replace", () => {
    const { result } = renderHook(() =>
      useAdminRegistrationsList({ ...baseParams, rows: [makeRow()], totalCount: 50 }),
    );
    act(() => {
      result.current.setPage(2);
    });
    expect(routerReplace).toHaveBeenCalled();
    const url = routerReplace.mock.calls[0][0] as string;
    expect(url).toContain("page=2");
  });
});
