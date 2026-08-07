"use client";

/**
 * Fake backdrop for dialogs opened with `show()` (stackBelowTour).
 * Native `::backdrop` only exists for `showModal()`; tours need show() so Driver
 * can sit above the dialog — this scrim restores the system modal blur separately.
 */
export function ModalStackedScrim({
  onDismiss,
}: {
  /** When null, clicks do not dismiss (disableClose). */
  onDismiss: (() => void) | null;
}) {
  return (
    <div
      role="presentation"
      aria-hidden
      data-ge-modal-stacked-scrim=""
      className="ge-modal-stacked-scrim fixed inset-0 z-[90]"
      onClick={onDismiss ?? undefined}
    />
  );
}
