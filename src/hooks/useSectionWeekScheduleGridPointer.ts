import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import type { SectionScheduleSlot } from "@/types/academics";
import { SECTION_WEEK_UI_DAY_ORDER } from "@/lib/academics/sectionScheduleWeekColumns";
import { snapMinutesToStep } from "@/lib/academics/sectionScheduleTimeSnap";
import {
  SECTION_WEEK_SCHEDULE_PX_PER_MINUTE,
  SECTION_WEEK_SCHEDULE_STEP_MINUTES,
} from "@/lib/academics/sectionScheduleWeekWindow";

const STEP_MINUTES = SECTION_WEEK_SCHEDULE_STEP_MINUTES;
const PX_PER_MINUTE = SECTION_WEEK_SCHEDULE_PX_PER_MINUTE;
const DRAG_THRESHOLD_PX = 6;

type DragState = {
  kind: "move" | "resize";
  pointerId: number;
  index: number;
  originX: number;
  originY: number;
  active: boolean;
};

export type UseSectionWeekScheduleGridPointerArgs = {
  slots: SectionScheduleSlot[];
  selectedIndex: number | null;
  setSelectedIndex: (i: number | null) => void;
  createAt: (dayOfWeek: number, startMinutes: number) => void;
  moveBlock: (index: number, dayOfWeek: number, startMinutes: number) => void;
  resizeBlock: (index: number, endMinutes: number) => void;
  windowStartMinutes: number;
};

export type UseSectionWeekScheduleGridPointerResult = {
  daysRef: RefObject<HTMLDivElement | null>;
  draggingIndex: number | null;
  onCreatePointerDown: (dayOfWeek: number, e: PointerEvent<HTMLButtonElement>) => void;
  onBlockPointerDown: (index: number, e: PointerEvent<HTMLButtonElement>) => void;
  onResizePointerDown: (index: number, e: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void;
};

export function useSectionWeekScheduleGridPointer({
  slots,
  selectedIndex,
  setSelectedIndex,
  createAt,
  moveBlock,
  resizeBlock,
  windowStartMinutes,
}: UseSectionWeekScheduleGridPointerArgs): UseSectionWeekScheduleGridPointerResult {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const slotsRef = useRef(slots);
  const selectedIndexRef = useRef(selectedIndex);
  const daysRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);
  useEffect(() => {
    selectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const resolveDayAtClientX = useCallback((clientX: number): number | null => {
    const node = daysRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const colW = rect.width / 7;
    const rel = Math.max(0, Math.min(rect.width - 1, clientX - rect.left));
    const idx = Math.max(0, Math.min(6, Math.floor(rel / colW)));
    return SECTION_WEEK_UI_DAY_ORDER[idx] ?? null;
  }, []);

  const resolveMinutesAtClientY = useCallback(
    (clientY: number): number => {
      const node = daysRef.current;
      if (!node) return 9 * 60;
      const rect = node.getBoundingClientRect();
      if (rect.height <= 0) return 9 * 60;
      const rel = Math.max(0, Math.min(rect.height - 1, clientY - rect.top));
      return snapMinutesToStep(windowStartMinutes + rel / PX_PER_MINUTE, STEP_MINUTES);
    },
    [windowStartMinutes],
  );

  const capturePointer = useCallback((pointerId: number) => {
    const node = daysRef.current as (HTMLDivElement & { setPointerCapture?: (id: number) => void }) | null;
    if (typeof node?.setPointerCapture === "function") node.setPointerCapture(pointerId);
  }, []);

  const onCreatePointerDown = useCallback(
    (dayOfWeek: number, e: PointerEvent<HTMLButtonElement>) => {
      createAt(dayOfWeek, resolveMinutesAtClientY(e.clientY));
    },
    [createAt, resolveMinutesAtClientY],
  );

  const onBlockPointerDown = useCallback(
    (index: number, e: PointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      selectedIndexRef.current = index;
      setSelectedIndex(index);
      dragRef.current = {
        kind: "move",
        pointerId: e.pointerId,
        index,
        originX: e.clientX,
        originY: e.clientY,
        active: false,
      };
      capturePointer(e.pointerId);
    },
    [capturePointer, setSelectedIndex],
  );

  const onResizePointerDown = useCallback(
    (index: number, e: PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      selectedIndexRef.current = index;
      setSelectedIndex(index);
      dragRef.current = {
        kind: "resize",
        pointerId: e.pointerId,
        index,
        originX: e.clientX,
        originY: e.clientY,
        active: false,
      };
      capturePointer(e.pointerId);
    },
    [capturePointer, setSelectedIndex],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const idx = selectedIndexRef.current;
      if (idx === null || !slotsRef.current[idx]) return;

      if (!drag.active) {
        const dist = Math.hypot(e.clientX - drag.originX, e.clientY - drag.originY);
        if (dist < DRAG_THRESHOLD_PX) return;
        drag.active = true;
        setDraggingIndex(idx);
      }

      if (drag.kind === "move") {
        const nextDay = resolveDayAtClientX(e.clientX);
        if (nextDay === null) return;
        moveBlock(idx, nextDay, resolveMinutesAtClientY(e.clientY));
        return;
      }
      resizeBlock(idx, resolveMinutesAtClientY(e.clientY));
    },
    [moveBlock, resizeBlock, resolveDayAtClientX, resolveMinutesAtClientY],
  );

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDraggingIndex(null);
    const node = daysRef.current as (HTMLDivElement & { releasePointerCapture?: (id: number) => void }) | null;
    if (typeof node?.releasePointerCapture === "function") node.releasePointerCapture(e.pointerId);
  }, []);

  return {
    daysRef,
    draggingIndex,
    onCreatePointerDown,
    onBlockPointerDown,
    onResizePointerDown,
    onPointerMove,
    onPointerUp,
  };
}
