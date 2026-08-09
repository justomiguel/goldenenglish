import type { ProgressSectionId } from "@/lib/parent/buildProgressSections";
import type { LoadErrorReporter } from "@/lib/logging/noteReadFailure";

export interface ProgressFailureTracker {
  /** Hand this to the loader that feeds one section. */
  reporterFor(sectionId: ProgressSectionId): LoadErrorReporter;
  /** Sections whose loader reported at least one failed read. */
  failedSections(): ProgressSectionId[];
}

/**
 * Collects, across the parallel Progress loaders, which sections came back short.
 *
 * Progress hides sections with nothing in them, so without this a failed read and an empty ward look
 * identical to the family.
 */
export function createProgressFailureTracker(): ProgressFailureTracker {
  const failed = new Set<ProgressSectionId>();

  return {
    reporterFor(sectionId: ProgressSectionId): LoadErrorReporter {
      return () => {
        failed.add(sectionId);
      };
    },
    failedSections(): ProgressSectionId[] {
      return [...failed];
    },
  };
}
