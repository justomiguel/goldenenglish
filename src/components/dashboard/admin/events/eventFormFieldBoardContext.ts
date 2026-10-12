"use client";

import { createContext, use } from "react";
import type { EventFormQuestionOrderItem } from "@/lib/events/buildEventFormQuestionItems";

export interface EventFormFieldBoardValue {
  itemByToken: Record<string, EventFormQuestionOrderItem>;
  containers: Record<string, string[]>;
  moveWithin: (containerId: string, index: number, delta: -1 | 1) => void;
}

export const EventFormFieldBoardContext = createContext<EventFormFieldBoardValue | null>(null);

export function useEventFormFieldBoard(): EventFormFieldBoardValue | null {
  return use(EventFormFieldBoardContext);
}
