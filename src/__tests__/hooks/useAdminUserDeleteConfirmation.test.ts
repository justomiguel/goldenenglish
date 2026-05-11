import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { previewAdminUserDeletionPlan } from "@/app/[locale]/dashboard/admin/users/deleteActions";
import { useAdminUserDeleteConfirmation } from "@/hooks/useAdminUserDeleteConfirmation";

vi.mock("@/app/[locale]/dashboard/admin/users/deleteActions", () => ({
  previewAdminUserDeletionPlan: vi.fn(),
}));

const previewMock = vi.mocked(previewAdminUserDeletionPlan);

const labels = {
  confirmDeleteCascadeGuardians: "{{guardians}} g / {{linkedStudents}} s",
  confirmDeleteResolvingNotice: "resolving",
};

describe("useAdminUserDeleteConfirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts idle and loads preview after setConfirmIds", async () => {
    previewMock.mockResolvedValue({
      ok: true,
      orderedIds: ["a", "b"],
      totalCount: 2,
      addedStudentCount: 0,
      guardianDeletingCount: 0,
      addedStudents: [],
    });

    const { result } = renderHook(() => useAdminUserDeleteConfirmation("es", labels));
    expect(result.current.deletePreviewBusy).toBe(false);
    expect(result.current.deleteModalTitleCount).toBe(0);

    act(() => {
      result.current.setConfirmIds(["x"]);
    });
    expect(result.current.deletePreviewBusy).toBe(true);

    await waitFor(() => {
      expect(result.current.deletePreviewBusy).toBe(false);
    });
    expect(result.current.effectiveDeleteIdsOnConfirm).toEqual(["a", "b"]);
    expect(result.current.deleteModalTitleCount).toBe(2);
  });

  it("surfaces preview error", async () => {
    previewMock.mockResolvedValue({ ok: false, message: "boom" });

    const { result } = renderHook(() => useAdminUserDeleteConfirmation("es", labels));

    act(() => {
      result.current.setConfirmIds(["y"]);
    });

    await waitFor(() => {
      expect(result.current.previewErrorNotice).toBe("boom");
    });
    expect(result.current.deletePreviewBusy).toBe(false);
  });

  it("builds cascade notice when guardians expand students", async () => {
    previewMock.mockResolvedValue({
      ok: true,
      orderedIds: ["g1"],
      totalCount: 3,
      addedStudentCount: 2,
      guardianDeletingCount: 1,
      addedStudents: [{ id: "s1", label: "S" }],
    });

    const { result } = renderHook(() => useAdminUserDeleteConfirmation("es", labels));

    act(() => {
      result.current.setConfirmIds(["g1"]);
    });

    await waitFor(() => {
      expect(result.current.cascadeNotice).toBe("1 g / 2 s");
    });
    expect(result.current.addedStudentsPreview).toHaveLength(1);
  });

  it("dismiss clears state", async () => {
    previewMock.mockResolvedValue({
      ok: true,
      orderedIds: ["a"],
      totalCount: 1,
      addedStudentCount: 0,
      guardianDeletingCount: 0,
      addedStudents: [],
    });

    const { result } = renderHook(() => useAdminUserDeleteConfirmation("es", labels));
    act(() => {
      result.current.setConfirmIds(["a"]);
    });
    await waitFor(() => {
      expect(result.current.deletePreviewBusy).toBe(false);
    });

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.confirmIds).toBeNull();
    expect(result.current.effectiveDeleteIdsOnConfirm).toEqual([]);
  });
});
