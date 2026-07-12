import { adminTourSelector, type AdminTourAnchor } from "@/lib/admin-tutorials/selectors";

/** Shared assertion helper for Vitest DOM (L2) and future Playwright helpers. */
export function expectTourAnchorsInDocument(
  anchors: readonly AdminTourAnchor[],
  query: (sel: string) => Element | null = (sel) => document.querySelector(sel),
): void {
  for (const anchor of anchors) {
    const el = query(adminTourSelector(anchor));
    if (!el) {
      throw new Error(`Missing tour anchor in DOM: data-tour="${anchor}"`);
    }
  }
}
