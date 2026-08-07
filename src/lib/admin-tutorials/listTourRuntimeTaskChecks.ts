import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { academicHubPath, academicCohortSectionsPath } from "@/lib/admin-tutorials/academicHubPath";
import { createUserPath } from "@/lib/admin-tutorials/createUserPath";
import type { TourRuntimeCheck } from "@/lib/admin-tutorials/listTourRuntimeCheckTypes";
import {
  academicSectionAttendancePath,
  blogNewPath,
  eventsNewPath,
  eventPaymentsPath,
  financeInboxPath,
  financeSettingsPath,
  sectionCollectionsPath,
  siteSetupPath,
  studentBillingPath,
  studentDetailPath,
  usersImportPath,
} from "@/lib/admin-tutorials/tourPaths";

/** Shared by create-student / create-teacher / create-admin L3 (email/guardian optional). */
const CREATE_USER_RUNTIME_ANCHORS: readonly AdminTourAnchor[] = [
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
];

/** Task-tutorial rows for the shared L1/L3 runtime matrix. */
export function listTourRuntimeTaskChecks(): readonly TourRuntimeCheck[] {
  return [
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
      id: "task:create-student",
      pathFor: (locale) => createUserPath(locale),
      anchors: CREATE_USER_RUNTIME_ANCHORS,
    },
    {
      id: "task:create-teacher",
      pathFor: (locale) => createUserPath(locale),
      anchors: CREATE_USER_RUNTIME_ANCHORS,
    },
    {
      id: "task:create-admin",
      pathFor: (locale) => createUserPath(locale),
      anchors: CREATE_USER_RUNTIME_ANCHORS,
    },
    {
      id: "task:create-event",
      pathFor: (locale) => eventsNewPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.eventCreateForm,
        ADMIN_TOUR_ANCHORS.eventCreateTitle,
        ADMIN_TOUR_ANCHORS.eventCreateDate,
        ADMIN_TOUR_ANCHORS.eventCreatePricing,
        ADMIN_TOUR_ANCHORS.eventCreateSubmit,
      ],
    },
    {
      id: "task:approve-payment",
      pathFor: (locale) => financeInboxPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.financeInboxRoot,
        ADMIN_TOUR_ANCHORS.financeInboxTypeNav,
        ADMIN_TOUR_ANCHORS.financeInboxApprove,
        ADMIN_TOUR_ANCHORS.financeInboxReject,
      ],
    },
    {
      id: "task:reject-payment",
      pathFor: (locale) => financeInboxPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.financeInboxRoot,
        ADMIN_TOUR_ANCHORS.financeInboxTypeNav,
        ADMIN_TOUR_ANCHORS.financeInboxApprove,
        ADMIN_TOUR_ANCHORS.financeInboxReject,
      ],
    },
    {
      id: "task:take-attendance",
      pathFor: (locale, env) => {
        if (!env.cohortId || !env.sectionId) return null;
        return academicSectionAttendancePath(locale, env.cohortId, env.sectionId);
      },
      anchors: [ADMIN_TOUR_ANCHORS.sectionAttendanceRoot],
    },
    {
      id: "task:assign-scholarship-percent",
      pathFor: (locale, env) => {
        if (!env.studentId) return null;
        return studentBillingPath(locale, env.studentId);
      },
      /** Tab chrome is always mounted; panel activates via tour event. */
      anchors: [ADMIN_TOUR_ANCHORS.scholarshipTab],
    },
    {
      id: "task:assign-scholarship-full",
      pathFor: (locale, env) => {
        if (!env.studentId) return null;
        return studentBillingPath(locale, env.studentId);
      },
      anchors: [ADMIN_TOUR_ANCHORS.scholarshipTab],
    },
    {
      id: "task:enable-mercadopago",
      pathFor: (locale) => financeSettingsPath(locale),
      /** Root always mounts; country cards depend on gateway rows (optional in tour). */
      anchors: [ADMIN_TOUR_ANCHORS.financeSettingsRoot],
    },
    {
      id: "task:enable-flow",
      pathFor: (locale) => financeSettingsPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.financeSettingsRoot,
        ADMIN_TOUR_ANCHORS.financeSettingsFlowCard,
      ],
    },
    {
      id: "task:change-billing-currency",
      pathFor: (locale) => financeSettingsPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.financeSettingsRoot,
        ADMIN_TOUR_ANCHORS.financeSettingsCurrencySection,
      ],
    },
    {
      id: "task:approve-event-payment",
      pathFor: (locale, env) => {
        if (!env.eventId) return null;
        return eventPaymentsPath(locale, env.eventId);
      },
      anchors: [
        ADMIN_TOUR_ANCHORS.eventPaymentsTab,
        ADMIN_TOUR_ANCHORS.eventPaymentsPanel,
      ],
    },
    {
      id: "task:assign-section-scholarship-bulk",
      pathFor: (locale, env) => {
        if (!env.sectionId) return null;
        return sectionCollectionsPath(locale, env.sectionId);
      },
      anchors: [
        ADMIN_TOUR_ANCHORS.sectionCollectionsRoot,
        ADMIN_TOUR_ANCHORS.sectionCollectionsBulkScholarshipTrigger,
      ],
    },
    {
      id: "task:change-site-setup-currency",
      pathFor: (locale) => siteSetupPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.siteSetupStepIndicator,
        ADMIN_TOUR_ANCHORS.siteSetupPanel,
        ADMIN_TOUR_ANCHORS.siteSetupNav,
      ],
    },
    {
      id: "task:create-blog-article",
      pathFor: (locale) => blogNewPath(locale),
      anchors: [ADMIN_TOUR_ANCHORS.blogEditorRoot, ADMIN_TOUR_ANCHORS.blogEditorSave],
    },
    {
      id: "task:create-blog-article-as-teacher",
      pathFor: (locale) => blogNewPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.blogEditorRoot,
        ADMIN_TOUR_ANCHORS.blogEditorStatus,
        ADMIN_TOUR_ANCHORS.blogEditorSave,
      ],
    },
    {
      id: "task:reset-user-password",
      pathFor: (locale, env) => {
        if (!env.studentId) return null;
        return studentDetailPath(locale, env.studentId);
      },
      anchors: [ADMIN_TOUR_ANCHORS.userDetailSecurityTab],
    },
    {
      id: "task:import-users",
      pathFor: (locale) => usersImportPath(locale),
      anchors: [
        ADMIN_TOUR_ANCHORS.usersImportTitle,
        ADMIN_TOUR_ANCHORS.usersImportChooseFile,
      ],
    },
  ];
}
