/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSectionEnrollmentQueue } from "@/hooks/useSectionEnrollmentQueue";
import {
  previewSectionEnrollmentAction,
  enrollStudentInSectionAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";

vi.mock("@/app/[locale]/dashboard/admin/academics/actions", () => ({
  previewSectionEnrollmentAction: vi.fn(),
  enrollStudentInSectionAction: vi.fn(),
}));

const copy = {
  previewOk: "ok",
  bulkPreviewAllOk: "all {{count}} ok",
  bulkPreviewIssues: "issues {{detail}}",
  bulkEnrollDoneMany: "done {{count}}",
  bulkEnrollPartial: "partial {{ok}} {{total}} {{names}}",
  bulkEnrollFailed: "fail {{total}} {{names}}",
  successEnroll: "saved",
};

describe("useSectionEnrollmentQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dedupes when adding the same student twice", () => {
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
      }),
    );
    act(() => {
      result.current.addPick({ id: "s1", label: "A" });
      result.current.addPick({ id: "s1", label: "A" });
    });
    expect(result.current.queue).toHaveLength(1);
  });

  it("removeId drops a queued student", () => {
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
      }),
    );
    act(() => {
      result.current.addPick({ id: "s1", label: "A" });
      result.current.removeId("s1");
    });
    expect(result.current.queue).toHaveLength(0);
  });

  it("runPreviewSingle sets message on preview ok", async () => {
    vi.mocked(previewSectionEnrollmentAction).mockResolvedValueOnce({
      ok: true,
      parentPaymentsPending: false,
    });
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
      }),
    );
    act(() => result.current.addPick({ id: "s1", label: "A" }));
    act(() => result.current.runPreview());
    await waitFor(() => expect(result.current.msg).toBe(copy.previewOk));
  });

  it("runPreviewAll summarizes mixed preview results", async () => {
    vi.mocked(previewSectionEnrollmentAction)
      .mockResolvedValueOnce({ ok: true, parentPaymentsPending: false })
      .mockResolvedValueOnce({ ok: false, code: "PARSE" });
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
      }),
    );
    act(() => {
      result.current.addPick({ id: "s1", label: "L1" });
      result.current.addPick({ id: "s2", label: "L2" });
    });
    act(() => result.current.runPreview());
    await waitFor(() =>
      expect(result.current.msg).toContain("L2"),
    );
  });

  it("runEnrollSingle clears queue on success", async () => {
    vi.mocked(enrollStudentInSectionAction).mockResolvedValueOnce({ ok: true });
    const onOk = vi.fn();
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
        onEnrollSuccess: onOk,
      }),
    );
    act(() => result.current.addPick({ id: "s1", label: "A" }));
    act(() => result.current.runEnrollSingle(null));
    await waitFor(() => {
      expect(result.current.queue).toHaveLength(0);
      expect(onOk).toHaveBeenCalled();
    });
  });

  it("runPreviewSingle opens modal on schedule overlap", async () => {
    vi.mocked(previewSectionEnrollmentAction).mockResolvedValueOnce({
      ok: false,
      code: "SCHEDULE_OVERLAP",
      conflicts: [{ kind: "overlap" } as never],
      targetSlots: [{ day: 1 } as never],
      parentPaymentsPending: false,
    });
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse", SCHEDULE_OVERLAP: "ov" },
        copy,
      }),
    );
    act(() => result.current.addPick({ id: "s1", label: "A" }));
    act(() => result.current.runPreview());
    await waitFor(() => expect(result.current.modalOpen).toBe(true));
  });

  it("runEnrollAll partial outcome shows partial copy", async () => {
    vi.mocked(enrollStudentInSectionAction)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, code: "RPC" });
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
      }),
    );
    act(() => {
      result.current.addPick({ id: "s1", label: "L1" });
      result.current.addPick({ id: "s2", label: "L2" });
    });
    act(() => result.current.runEnrollAll());
    await waitFor(() => expect(result.current.msg).toContain("partial"));
  });

  it("runEnrollAll all succeed shows done copy", async () => {
    vi.mocked(enrollStudentInSectionAction).mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
      }),
    );
    act(() => {
      result.current.addPick({ id: "s1", label: "L1" });
      result.current.addPick({ id: "s2", label: "L2" });
    });
    act(() => result.current.runEnrollAll());
    await waitFor(() => expect(result.current.msg).toContain("done"));
  });

  it("runEnrollAll reports all failed when every enroll fails", async () => {
    vi.mocked(enrollStudentInSectionAction).mockResolvedValue({ ok: false, code: "RPC" });
    const { result } = renderHook(() =>
      useSectionEnrollmentQueue({
        locale: "en",
        sectionId: "00000000-0000-4000-8000-000000000001",
        capacityOverride: false,
        errors: { RPC: "rpc", PARSE: "parse" },
        copy,
      }),
    );
    act(() => {
      result.current.addPick({ id: "s1", label: "L1" });
      result.current.addPick({ id: "s2", label: "L2" });
    });
    act(() => result.current.runEnrollAll());
    await waitFor(() => expect(result.current.msg).toContain("fail"));
  });
});
