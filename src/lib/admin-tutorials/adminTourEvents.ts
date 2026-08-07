/** Dispatched on `window` so AcademicHubToolbar can open the new-cohort modal during a tour. */
export const ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT = "ge:admin-tutorial:open-new-cohort";

/** Switches AcademicCohortDetailShell to the sections tab during a tour. */
export const ADMIN_TUTORIAL_ACTIVATE_COHORT_SECTIONS_TAB_EVENT =
  "ge:admin-tutorial:activate-cohort-sections-tab";

/** Dispatched on `window` so CohortSectionsToolbar can open the new-section modal during a tour. */
export const ADMIN_TUTORIAL_OPEN_NEW_SECTION_EVENT = "ge:admin-tutorial:open-new-section";

/** Switches student billing tabs to Scholarships during a tour. */
export const ADMIN_TUTORIAL_ACTIVATE_SCHOLARSHIPS_TAB_EVENT =
  "ge:admin-tutorial:activate-scholarships-tab";

/** Switches admin user profile ficha to Security during a tour. */
export const ADMIN_TUTORIAL_ACTIVATE_SECURITY_TAB_EVENT =
  "ge:admin-tutorial:activate-security-tab";

/**
 * Dispatched on `window` so `useAdminCreateUserForm` can apply role + sample birth date
 * for guide-only create-user tours (React-controlled fields).
 */
export const ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT =
  "ge:admin-tutorial:apply-create-user-demo";

/** Switches site setup wizard to Legal & billing (step index 5). */
export const ADMIN_TUTORIAL_ACTIVATE_SITE_SETUP_LEGAL_BILLING_STEP_EVENT =
  "ge:admin-tutorial:activate-site-setup-legal-billing-step";

/** Switches finance section collections to the Scholarships tab. */
export const ADMIN_TUTORIAL_ACTIVATE_SECTION_COLLECTIONS_SCHOLARSHIPS_TAB_EVENT =
  "ge:admin-tutorial:activate-section-collections-scholarships-tab";

/** Opens bulk scholarship modal during guide-only tours (never confirms). */
export const ADMIN_TUTORIAL_OPEN_BULK_SCHOLARSHIP_MODAL_EVENT =
  "ge:admin-tutorial:open-bulk-scholarship-modal";
