import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { academicHubPath, academicCohortSectionsPath } from "@/lib/admin-tutorials/academicHubPath";
import {
  adminHomePath,
  adminProfilePath,
  adminScreenPath,
} from "@/lib/admin-tutorials/screenCatalog";
import { createUserPath } from "@/lib/admin-tutorials/createUserPath";

export type TourRuntimeEnv = {
  /** Required for create-section smoke when set. */
  cohortId?: string;
};

export type TourRuntimeCheck = {
  /** Stable id for failures (`screen:admin-home`, `task:create-cohort`, …). */
  id: string;
  /**
   * Absolute path for the locale, or `null` when env is insufficient
   * (caller should skip that check).
   */
  pathFor: (locale: string, env: TourRuntimeEnv) => string | null;
  /** Anchors expected visible on that route without opening modals / creating data. */
  anchors: readonly AdminTourAnchor[];
};

/**
 * Shared matrix for Vitest consistency checks and Playwright `@admin-tours` smokes.
 * Keep in sync when tour routes or always-visible anchors change (rule 33).
 */
export function listTourRuntimeChecks(): readonly TourRuntimeCheck[] {
  return [
    {
      id: "screen:admin-home",
      pathFor: (locale) => adminHomePath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.sidebar,
        ADMIN_TOUR_ANCHORS.chromeHeader,
        ADMIN_TOUR_ANCHORS.chromeBackToSite,
        ADMIN_TOUR_ANCHORS.chromeSignOut,
        ADMIN_TOUR_ANCHORS.chromeLocale,
        ADMIN_TOUR_ANCHORS.hubTitle,
        ADMIN_TOUR_ANCHORS.hubBirthdays,
        ADMIN_TOUR_ANCHORS.hubTraffic,
        ADMIN_TOUR_ANCHORS.hubUsers,
        ADMIN_TOUR_ANCHORS.hubPayments,
        ADMIN_TOUR_ANCHORS.hubRegistrations,
        ADMIN_TOUR_ANCHORS.hubMessages,
      ],
    },
    {
      id: "screen:admin-users",
      pathFor: (locale) => adminScreenPath(locale, "admin-users"),
      anchors: [
        ADMIN_TOUR_ANCHORS.usersTitle,
        ADMIN_TOUR_ANCHORS.usersToolbar,
        ADMIN_TOUR_ANCHORS.usersTable,
      ],
    },
    {
      id: "screen:admin-glossary",
      pathFor: (locale) => adminScreenPath(locale, "admin-glossary"),
      anchors: [
        ADMIN_TOUR_ANCHORS.glossaryTitle,
        ADMIN_TOUR_ANCHORS.glossaryHierarchy,
        ADMIN_TOUR_ANCHORS.glossaryGroups,
      ],
    },
    {
      id: "screen:admin-academic",
      pathFor: (locale) => adminScreenPath(locale, "admin-academic"),
      anchors: [
        ADMIN_TOUR_ANCHORS.academicTitle,
        ADMIN_TOUR_ANCHORS.newCohort,
        ADMIN_TOUR_ANCHORS.academicBoardTabs,
        ADMIN_TOUR_ANCHORS.academicCohortList,
      ],
    },
    {
      id: "screen:admin-profile",
      pathFor: (locale) => adminProfilePath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.profileHeader,
        ADMIN_TOUR_ANCHORS.profileAvatar,
        ADMIN_TOUR_ANCHORS.profilePersonalForm,
      ],
    },
    {
      id: "task:create-cohort",
      pathFor: (locale) => academicHubPath(locale),
      anchors: [ADMIN_TOUR_ANCHORS.newCohort, ADMIN_TOUR_ANCHORS.navAcademic],
    },
    {
      id: "task:create-section",
      pathFor: (locale, env) => {
        if (!env.cohortId) return null;
        return academicCohortSectionsPath(locale, env.cohortId);
      },
      anchors: [
        ADMIN_TOUR_ANCHORS.cohortDetail,
        ADMIN_TOUR_ANCHORS.cohortSectionsTab,
        ADMIN_TOUR_ANCHORS.newSection,
      ],
    },
    {
      id: "task:create-user",
      pathFor: (locale) => createUserPath(locale),
      // Email/guardian are path-dependent (role + birth date); do not require them on load.
      anchors: [
        ADMIN_TOUR_ANCHORS.navUsers,
        ADMIN_TOUR_ANCHORS.usersNavAdd,
        ADMIN_TOUR_ANCHORS.createUserForm,
        ADMIN_TOUR_ANCHORS.createUserRole,
        ADMIN_TOUR_ANCHORS.createUserLastName,
        ADMIN_TOUR_ANCHORS.createUserFirstName,
        ADMIN_TOUR_ANCHORS.createUserDni,
        ADMIN_TOUR_ANCHORS.createUserBirth,
        ADMIN_TOUR_ANCHORS.createUserPassword,
        ADMIN_TOUR_ANCHORS.createUserSubmit,
      ],
    },
  ];
}
