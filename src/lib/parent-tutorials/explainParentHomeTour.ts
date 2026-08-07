import type { ParentTourStepDef } from "@/lib/parent-tutorials/parentTourStepDef";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

export type ExplainParentHomeStepCopy = {
  title: string;
  description: string;
};

export type ExplainParentHomeTourCopy = {
  intro: ExplainParentHomeStepCopy;
  sidebar: ExplainParentHomeStepCopy;
  tabBar: ExplainParentHomeStepCopy;
  chromeHeader: ExplainParentHomeStepCopy;
  chromeProfile: ExplainParentHomeStepCopy;
  chromeSignOut: ExplainParentHomeStepCopy;
  titleBlock: ExplainParentHomeStepCopy;
  childSwitcher: ExplainParentHomeStepCopy;
  statusPillars: ExplainParentHomeStepCopy;
  inbox: ExplainParentHomeStepCopy;
  closing: ExplainParentHomeStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

/** Driver steps for explaining parent home (chrome + content; filter by surface). */
export function buildExplainParentHomeSteps(
  copy: ExplainParentHomeTourCopy,
): ParentTourStepDef[] {
  return [
    {
      anchor: null,
      title: copy.intro.title,
      description: copy.intro.description,
      surfaces: ["both"],
    },
    {
      anchor: PARENT_TOUR_ANCHORS.sidebar,
      title: copy.sidebar.title,
      description: copy.sidebar.description,
      surfaces: ["desktop"],
    },
    {
      anchor: PARENT_TOUR_ANCHORS.tabBar,
      title: copy.tabBar.title,
      description: copy.tabBar.description,
      surfaces: ["mobile"],
    },
    {
      anchor: PARENT_TOUR_ANCHORS.chromeHeader,
      title: copy.chromeHeader.title,
      description: copy.chromeHeader.description,
      surfaces: ["both"],
      optional: true,
    },
    {
      anchor: PARENT_TOUR_ANCHORS.chromeProfile,
      title: copy.chromeProfile.title,
      description: copy.chromeProfile.description,
      surfaces: ["both"],
      optional: true,
    },
    {
      anchor: PARENT_TOUR_ANCHORS.chromeSignOut,
      title: copy.chromeSignOut.title,
      description: copy.chromeSignOut.description,
      surfaces: ["both"],
      optional: true,
    },
    {
      anchor: PARENT_TOUR_ANCHORS.homeTitle,
      title: copy.titleBlock.title,
      description: copy.titleBlock.description,
      surfaces: ["both"],
      optional: true,
    },
    {
      anchor: PARENT_TOUR_ANCHORS.homeChildSwitcher,
      title: copy.childSwitcher.title,
      description: copy.childSwitcher.description,
      surfaces: ["both"],
      optional: true,
    },
    {
      anchor: PARENT_TOUR_ANCHORS.homeStatusPillars,
      title: copy.statusPillars.title,
      description: copy.statusPillars.description,
      surfaces: ["both"],
      optional: true,
    },
    {
      anchor: PARENT_TOUR_ANCHORS.homeInbox,
      title: copy.inbox.title,
      description: copy.inbox.description,
      surfaces: ["both"],
      optional: true,
    },
    {
      anchor: null,
      title: copy.closing.title,
      description: copy.closing.description,
      surfaces: ["both"],
    },
  ];
}
