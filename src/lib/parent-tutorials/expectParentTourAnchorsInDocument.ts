import {
  parentTourSelector,
  type ParentTourAnchor,
} from "@/lib/parent-tutorials/selectors";

/** Shared assertion helper for Vitest DOM (L2) parent tour contracts. */
export function expectParentTourAnchorsInDocument(
  anchors: readonly ParentTourAnchor[],
  query: (sel: string) => Element | null = (sel) => document.querySelector(sel),
): void {
  for (const anchor of anchors) {
    const el = query(parentTourSelector(anchor));
    if (!el) {
      throw new Error(`Missing tour anchor in DOM: data-tour="${anchor}"`);
    }
  }
}
