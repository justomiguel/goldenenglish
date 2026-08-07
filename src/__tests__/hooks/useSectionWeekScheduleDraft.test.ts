/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { SectionScheduleSlot } from "@/types/academics";
import { useSectionWeekScheduleDraft } from "@/hooks/useSectionWeekScheduleDraft";

const refresh = vi.fn();
const updateAcademicSectionScheduleAction = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionActions", () => ({
  updateAcademicSectionScheduleAction: (...args: unknown[]) =>
    updateAcademicSectionScheduleAction(...args),
}));

const dict = {
  scheduleInvalid: "Invalid schedule",
  saveScheduleError: "Could not save",
  overlapError: "Overlap",
} as const;

describe("useSectionWeekScheduleDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createAt uses the default duration mode", () => {
    const initialSlots: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "08:45" },
      { dayOfWeek: 1, startTime: "09:00", endTime: "09:45" },
      { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
    ];

    const { result } = renderHook(() =>
      useSectionWeekScheduleDraft({
        locale: "en",
        sectionId: "section-1",
        initialSlots,
        dict,
      }),
    );

    act(() => result.current.createAt(1, 12 * 60));

    expect(result.current.slots).toContainEqual({
      dayOfWeek: 1,
      startTime: "12:00",
      endTime: "12:45",
    });
  });

  it("createAt snaps to 15′ boundaries", () => {
    const { result } = renderHook(() =>
      useSectionWeekScheduleDraft({
        locale: "en",
        sectionId: "section-1",
        initialSlots: [],
        dict,
      }),
    );

    act(() => result.current.createAt(1, 8 * 60 + 8));

    expect(result.current.slots).toContainEqual({
      dayOfWeek: 1,
      startTime: "08:15",
      endTime: "09:15",
    });
  });

  it("moveBlock rejects overlap (unchanged slots + overlapError)", () => {
    const initialSlots: SectionScheduleSlot[] = [
      { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
      { dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
    ];

    const { result } = renderHook(() =>
      useSectionWeekScheduleDraft({
        locale: "en",
        sectionId: "section-1",
        initialSlots,
        dict,
      }),
    );

    const before = result.current.slots;
    act(() => result.current.moveBlock(1, 1, 8 * 60 + 30));

    expect(result.current.slots).toEqual(before);
    expect(result.current.error).toBe(dict.overlapError);
  });

  it("updateBlock snaps times and enforces min duration ≥15′", () => {
    const { result } = renderHook(() =>
      useSectionWeekScheduleDraft({
        locale: "en",
        sectionId: "section-1",
        initialSlots: [{ dayOfWeek: 1, startTime: "08:00", endTime: "08:45" }],
        dict,
      }),
    );

    act(() =>
      result.current.updateBlock(0, {
        startTime: "08:08",
        endTime: "08:20",
      }),
    );

    expect(result.current.slots[0]).toEqual({
      dayOfWeek: 1,
      startTime: "08:15",
      endTime: "08:30",
    });
  });

  it("save with empty slots does not call action (scheduleInvalid)", async () => {
    const { result } = renderHook(() =>
      useSectionWeekScheduleDraft({
        locale: "en",
        sectionId: "section-1",
        initialSlots: [],
        dict,
      }),
    );

    act(() => result.current.save());

    await waitFor(() => expect(result.current.error).toBe(dict.scheduleInvalid));
    expect(updateAcademicSectionScheduleAction).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("successful save calls action and router.refresh()", async () => {
    updateAcademicSectionScheduleAction.mockResolvedValueOnce({ ok: true });

    const { result } = renderHook(() =>
      useSectionWeekScheduleDraft({
        locale: "en",
        sectionId: "section-1",
        initialSlots: [{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }],
        dict,
      }),
    );

    act(() => result.current.createAt(1, 10 * 60));
    act(() => result.current.save());

    await waitFor(() => {
      expect(updateAcademicSectionScheduleAction).toHaveBeenCalledTimes(1);
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });

  it("save double-click does not call action twice", async () => {
    let resolveAction: ((value: { ok: boolean }) => void) | undefined;
    const actionPromise = new Promise<{ ok: boolean }>((resolve) => {
      resolveAction = resolve;
    });
    updateAcademicSectionScheduleAction.mockImplementationOnce(() => actionPromise);

    const { result } = renderHook(() =>
      useSectionWeekScheduleDraft({
        locale: "en",
        sectionId: "section-1",
        initialSlots: [{ dayOfWeek: 1, startTime: "08:00", endTime: "09:00" }],
        dict,
      }),
    );

    act(() => {
      result.current.save();
      result.current.save();
    });

    await waitFor(() => {
      expect(updateAcademicSectionScheduleAction).toHaveBeenCalledTimes(1);
    });

    resolveAction?.({ ok: true });

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});

