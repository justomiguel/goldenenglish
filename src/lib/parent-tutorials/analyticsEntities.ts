/**
 * Parent Help FAB tour analytics entity prefixes (user_events.entity).
 * Full values are dynamic: `parent_screen_tour:<ParentScreenTourId>` /
 * `parent_tutorial:<ParentTutorialId>` — see startExplainParentScreenTour /
 * startParentTutorial. entity is a free-form string on the analytics API.
 */
export const PARENT_TOUR_ANALYTICS = {
  screenTourPrefix: "parent_screen_tour:",
  tutorialPrefix: "parent_tutorial:",
} as const;
