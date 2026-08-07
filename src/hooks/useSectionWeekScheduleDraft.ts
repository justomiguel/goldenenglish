import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SectionScheduleSlot } from "@/types/academics";
import { updateAcademicSectionScheduleAction } from "@/app/[locale]/dashboard/admin/academic/sectionActions";
import { normalizeSectionScheduleSlots } from "@/lib/academics/sectionScheduleSlots";
import {
  draftCreateAt,
  draftMoveBlock,
  draftRemoveBlock,
  draftResizeBlock,
  draftUpdateBlock,
  normalizeForCompare,
  slotKey,
  type SectionWeekScheduleDraftState,
} from "@/lib/academics/sectionWeekScheduleDraftMutations";

export function useSectionWeekScheduleDraft(args: {
  locale: string;
  sectionId: string;
  initialSlots: SectionScheduleSlot[];
  dict: { scheduleInvalid: string; saveScheduleError: string; overlapError: string };
}): {
  slots: SectionScheduleSlot[];
  dirty: boolean;
  selectedIndex: number | null;
  setSelectedIndex: (i: number | null) => void;
  error: string | null;
  pending: boolean;
  createAt: (dayOfWeek: number, startMinutes: number) => void;
  moveBlock: (index: number, dayOfWeek: number, startMinutes: number) => void;
  resizeBlock: (index: number, endMinutes: number) => void;
  updateBlock: (index: number, patch: Partial<SectionScheduleSlot>) => void;
  removeBlock: (index: number) => void;
  save: () => void;
} {
  const router = useRouter();
  const [draft, setDraft] = useState<SectionWeekScheduleDraftState>(() => ({
    slots: normalizeForCompare(args.initialSlots),
    selectedIndex: null,
    error: null,
  }));
  const [pending, setPending] = useState(false);

  const initialJsonRef = useRef<string>(JSON.stringify(normalizeForCompare(args.initialSlots)));
  const saveInFlightRef = useRef(false);

  const dirty = useMemo(() => {
    const now = JSON.stringify(normalizeForCompare(draft.slots));
    return now !== initialJsonRef.current;
  }, [draft.slots]);

  const createAt = useCallback(
    (dayOfWeek: number, startMinutes: number) => {
      setDraft((prev) =>
        draftCreateAt({
          state: prev,
          dayOfWeek,
          startMinutes,
          overlapError: args.dict.overlapError,
        }),
      );
    },
    [args.dict.overlapError],
  );

  const moveBlock = useCallback(
    (index: number, dayOfWeek: number, startMinutes: number) => {
      setDraft((prev) =>
        draftMoveBlock({
          state: prev,
          index,
          dayOfWeek,
          startMinutes,
          overlapError: args.dict.overlapError,
        }),
      );
    },
    [args.dict.overlapError],
  );

  const resizeBlock = useCallback(
    (index: number, endMinutes: number) => {
      setDraft((prev) =>
        draftResizeBlock({
          state: prev,
          index,
          endMinutes,
          overlapError: args.dict.overlapError,
        }),
      );
    },
    [args.dict.overlapError],
  );

  const updateBlock = useCallback(
    (index: number, patch: Partial<SectionScheduleSlot>) => {
      setDraft((prev) =>
        draftUpdateBlock({
          state: prev,
          index,
          patch,
          overlapError: args.dict.overlapError,
        }),
      );
    },
    [args.dict.overlapError],
  );

  const removeBlock = useCallback((index: number) => {
    setDraft((prev) =>
      draftRemoveBlock({
        state: prev,
        index,
      }),
    );
  }, []);

  const setSelectedIndex = useCallback((i: number | null) => {
    setDraft((prev) => ({ ...prev, selectedIndex: i }));
  }, []);

  const save = useCallback(() => {
    void (async () => {
      const normalized = normalizeSectionScheduleSlots(draft.slots);
      if (!normalized || normalized.length === 0) {
        setDraft((prev) => ({ ...prev, error: args.dict.scheduleInvalid }));
        return;
      }

      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;

      setPending(true);
      setDraft((prev) => ({ ...prev, error: null }));
      try {
        const result = await updateAcademicSectionScheduleAction({
          locale: args.locale,
          sectionId: args.sectionId,
          scheduleSlots: normalized,
        });
        if (!result.ok) {
          setDraft((prev) => ({ ...prev, error: args.dict.saveScheduleError }));
          return;
        }

        initialJsonRef.current = JSON.stringify(normalizeForCompare(normalized));
        setDraft((prev) => {
          const selectedSlot =
            prev.selectedIndex === null ? null : (prev.slots[prev.selectedIndex] ?? null);
          const previousKey = selectedSlot ? slotKey(selectedSlot) : null;
          const nextSlots = normalizeForCompare(normalized);
          const idx =
            previousKey === null
              ? -1
              : nextSlots.findIndex((s) => slotKey(s) === previousKey);
          const nextSelectedIndex = idx >= 0 ? idx : null;
          return { slots: nextSlots, selectedIndex: nextSelectedIndex, error: null };
        });
        router.refresh();
      } catch {
        setDraft((prev) => ({ ...prev, error: args.dict.saveScheduleError }));
      } finally {
        setPending(false);
        saveInFlightRef.current = false;
      }
    })();
  }, [
    args.dict.saveScheduleError,
    args.dict.scheduleInvalid,
    args.locale,
    args.sectionId,
    draft.slots,
    router,
  ]);

  return {
    slots: draft.slots,
    dirty,
    selectedIndex: draft.selectedIndex,
    setSelectedIndex,
    error: draft.error,
    pending,
    createAt,
    moveBlock,
    resizeBlock,
    updateBlock,
    removeBlock,
    save,
  };
}

