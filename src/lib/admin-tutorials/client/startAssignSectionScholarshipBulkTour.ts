import { runDriverTour } from "@/lib/admin-tutorials/client/runDriverTour";
import {
  ensureTourPath,
  isSectionCollectionsPath,
  sectionCollectionsPath,
  SECTION_COLLECTIONS_WAIT_ANCHOR,
} from "@/lib/admin-tutorials/client/ensureTourPath";
import { waitForSelector } from "@/lib/admin-tutorials/client/waitForSelector";
import { filterTourStepsForDom } from "@/lib/admin-tutorials/filterTourStepsForDom";
import {
  buildAssignSectionScholarshipBulkTourSteps,
  type AssignSectionScholarshipBulkTourCopy,
} from "@/lib/admin-tutorials/assignSectionScholarshipBulkTour";
import { ADMIN_TOUR_ANCHORS, adminTourSelector } from "@/lib/admin-tutorials/selectors";
import { trackEvent } from "@/lib/analytics/trackClient";
import { logClientWarn } from "@/lib/logging/clientLog";

const TUTORIAL_ID = "assign-section-scholarship-bulk" as const;
const ENTITY = `admin_tutorial:${TUTORIAL_ID}`;

function parseSectionId(pathname: string, locale: string): string | null {
  const prefix = `/${locale}/dashboard/admin/finance/collections/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).replace(/\/$/, "");
  const id = rest.split("/")[0];
  return id || null;
}

export async function startAssignSectionScholarshipBulkTour(input: {
  locale: string;
  pathname: string;
  copy: AssignSectionScholarshipBulkTourCopy;
  push: (href: string) => void;
  sectionId?: string | null;
}): Promise<void> {
  trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "start" });

  const sectionId = parseSectionId(input.pathname, input.locale) ?? input.sectionId?.trim();
  if (!sectionId) {
    logClientWarn("admin.tutorials.assignSectionScholarshipBulk", {
      reason: "no_section_target",
    });
    return;
  }

  const ready = await ensureTourPath({
    locale: input.locale,
    pathname: input.pathname,
    targetPath: sectionCollectionsPath(input.locale, sectionId),
    alreadyOnPath: isSectionCollectionsPath(input.pathname, input.locale, sectionId),
    waitAnchor: SECTION_COLLECTIONS_WAIT_ANCHOR,
    push: input.push,
    scope: "admin.tutorials.assignSectionScholarshipBulk",
    reason: "section_collections_missing",
  });
  if (!ready) return;

  const trigger = await waitForSelector(
    adminTourSelector(ADMIN_TOUR_ANCHORS.sectionCollectionsBulkScholarshipTrigger),
    { timeoutMs: 8000 },
  );
  if (!trigger) {
    logClientWarn("admin.tutorials.assignSectionScholarshipBulk", {
      reason: "bulk_trigger_missing",
    });
  }

  await runDriverTour({
    steps: filterTourStepsForDom(buildAssignSectionScholarshipBulkTourSteps(input.copy)),
    copy: {
      doneBtn: input.copy.doneBtn,
      nextBtn: input.copy.nextBtn,
      prevBtn: input.copy.prevBtn,
      closeBtn: input.copy.closeBtn,
      progressText: input.copy.progressText,
    },
    onComplete: () =>
      trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "complete" }),
    onSkip: () => trackEvent("action", ENTITY, { tutorialId: TUTORIAL_ID, phase: "skip" }),
  });
}
