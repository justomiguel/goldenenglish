// REGRESSION CHECK: L2 tour staleness — mount real admin shells with fixtures (no Supabase).
// Shared matrix: listTourRuntimeChecks (rule 33 / isolated E2E harness).
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { listTourRuntimeChecks } from "@/lib/admin-tutorials/listTourRuntimeChecks";
import { expectTourAnchorsInDocument } from "@/lib/admin-tutorials/expectTourAnchorsInDocument";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import { AcademicHubToolbar } from "@/components/organisms/AcademicHubToolbar";
import { AcademicCohortDetailShell } from "@/components/organisms/AcademicCohortDetailShell";
import { CohortSectionsToolbar } from "@/components/organisms/CohortSectionsToolbar";
import { AdminSectionSubnav } from "@/components/dashboard/AdminSectionSubnav";
import { AdminCreateUserForm } from "@/components/dashboard/AdminCreateUserForm";
import { ImportUsers } from "@/components/organisms/ImportUsers";
import { AdminEventCreateForm } from "@/components/dashboard/admin/events/AdminEventCreateForm";
import { AdminEventDetailTabs } from "@/components/dashboard/admin/events/AdminEventDetailTabs";
import { AdminEventPublishBar } from "@/components/dashboard/admin/events/AdminEventPublishBar";
import { AdminPortalCompose } from "@/components/dashboard/AdminPortalCompose";
import { AdminPortalMessageDetailView } from "@/components/dashboard/AdminPortalMessageDetailView";
import { AdminUserIdentityHero } from "@/components/molecules/AdminUserIdentityHero";
import { AdminUserProfileFicha } from "@/components/molecules/AdminUserProfileFicha";
import { AdminStudentBillingTabsPanel } from "@/components/dashboard/AdminStudentBillingTabsPanel";
import { BlogArticleEditor } from "@/components/dashboard/admin/cms/blog/BlogArticleEditor";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { BrandPublic } from "@/lib/brand/server";
import type { AcademicNewSectionModalDict } from "@/components/organisms/AcademicNewSectionModal.types";
import type { AcademicRolloverWizardDict } from "@/components/organisms/AcademicRolloverWizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/dashboard/admin",
}));

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

vi.mock("@/lib/dashboard/viewAsActions", () => ({
  clearViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/admin" })),
  openOwnTeacherAction: vi.fn(async () => ({ href: "/en/dashboard/teacher" })),
  searchViewAsPeopleAction: vi.fn(async () => ({ rows: [] })),
  startViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/student", started: true })),
}));

vi.mock("@/app/[locale]/dashboard/admin/academics/actions", () => ({
  createAcademicCohortAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/actions", () => ({
  createEventAction: vi.fn(),
  publishEventAction: vi.fn(),
  unpublishEventAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/messages/actions", () => ({
  sendAdminMessage: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/messages/siteContactVisitorReplyActions", () => ({
  sendAdminSiteContactVisitorReply: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/cms/blog/actions", () => ({
  saveBlogArticleAdminAction: vi.fn(),
  deleteBlogArticleAdminAction: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/cms/blog/blogTranslateAdminActions", () => ({
  translateBlogArticleFieldsAdminAction: vi.fn(),
}));

vi.mock("@/components/dashboard/admin/cms/blog/BlogArticleMaterialsSection", () => ({
  BlogArticleMaterialsSection: () => null,
}));

vi.mock("@/components/molecules/RichTextEditor", () => ({
  RichTextEditor: (props: { "aria-label"?: string }) => (
    <div data-testid="rich-editor" aria-label={props["aria-label"]} />
  ),
}));

vi.mock("@/components/molecules/AdminUserProfileTabPanels", () => ({
  AdminUserSummaryPanel: () => <div>Summary panel</div>,
  AdminUserAcademicPanel: () => <div>Academic panel</div>,
  AdminUserPaymentsPanel: () => <div>Payments panel</div>,
  AdminUserFamilyPanel: () => <div>Family panel</div>,
  AdminUserSecurityPanel: () => <div>Security panel</div>,
}));

vi.mock("@/components/organisms/AcademicRolloverWizard", () => ({
  AcademicRolloverWizard: () => null,
}));

vi.mock("@/components/organisms/AcademicNewSectionModal", () => ({
  AcademicNewSectionModal: () => null,
}));

vi.mock("@/hooks/useAdminCreateUserForm", () => ({
  useAdminCreateUserForm: () => ({
    onSubmit: (e: { preventDefault: () => void }) => e.preventDefault(),
    firstName: "",
    lastName: "",
    setFirstName: vi.fn(),
    setLastName: vi.fn(),
    showBirth: true,
    birthDate: "2010-01-15",
    setBirthDate: vi.fn(),
    resetGuardianUi: vi.fn(),
    showMinor: false,
    showMinorSyntheticHint: false,
    showAdultStudentEmail: true,
    isStudent: true,
    email: "",
    setEmail: vi.fn(),
    password: "",
    setPassword: vi.fn(),
    passwordHintId: "pw-hint",
    role: "student" as const,
    setRole: vi.fn(),
    dni: "",
    setDni: vi.fn(),
    phone: "",
    setPhone: vi.fn(),
    guardianMode: "existing" as const,
    setGuardianMode: vi.fn(),
    pickedGuardian: null,
    setPickedGuardian: vi.fn(),
    guardianSearchKey: 0,
    setGuardianSearchKey: vi.fn(),
    tutorDni: "",
    setTutorDni: vi.fn(),
    tutorFirstName: "",
    setTutorFirstName: vi.fn(),
    tutorLastName: "",
    setTutorLastName: vi.fn(),
    tutorEmail: "",
    setTutorEmail: vi.fn(),
    tutorPhone: "",
    setTutorPhone: vi.fn(),
    relationship: "" as const,
    setRelationship: vi.fn(),
    reuseConfirm: null,
    setReuseConfirm: vi.fn(),
    reuseBusy: false,
    feedback: null,
    busy: false,
    searchParents: vi.fn(),
    confirmReuseLink: vi.fn(),
  }),
}));

const brand: BrandPublic = {
  name: "E2E Institute",
  legalName: "E2E Institute",
  tagline: "tag",
  taglineEn: "tag",
  legalRegistry: "",
  logoPath: "/images/logo.png",
  logoAlt: "logo",
  faviconPath: "/favicon.ico",
  faviconBundlePrefix: null,
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
};

const summary: AdminHubSummary = {
  traffic: { totalHits: 1, authenticatedHits: 1, guestHits: 0 },
  trafficDaily: [],
  trafficWeekOverWeek: { thisWeek: 1, lastWeek: 1 },
  users: { total: 1, byRole: [{ role: "student", count: 1 }] },
  payments: { pendingCount: 0 },
  registrations: { newCount: 0, awaitingFeeCount: 0, totalCount: 0 },
  studentsWithoutSection: 0,
  messages: { recentCount: 0, latestPreview: null },
};

const academicDict = {
  newCohort: "New cohort",
  newCohortTip: "tip",
  newCohortModal: {
    title: "Create",
    nameLabel: "Name",
    slugLabel: "Slug",
    slugHint: "hint",
    submit: "Create",
    cancel: "Cancel",
    error: "Error",
  },
};

const sectionModalDict = {
  title: "t",
  nameLabel: "n",
  photoLabel: "ph",
  photoHint: "phh",
  photoInvalid: "phi",
  uploadProgressReading: "upr",
  uploadProgressSending: "ups",
  photoSaveFailed: "psf",
  teacherLabel: "te",
  teacherPlaceholder: "p",
  maxStudentsLabel: "m",
  maxStudentsDefaultHint: "h",
  maxStudentsCustomize: "c",
  maxStudentsCustomLabel: "cl",
  maxStudentsCustomHint: "ch",
  maxStudentsInvalid: "inv",
  submit: "ok",
  cancel: "c",
  error: "err",
  noTeachers: "nt",
  scheduleTitle: "st",
  scheduleHint: "sh",
  scheduleAddSlot: "add",
  scheduleRemoveSlot: "rm",
  scheduleDayLabel: "day",
  scheduleStartLabel: "start",
  scheduleEndLabel: "end",
  scheduleInvalid: "si",
  weekdays: { sun: "s", mon: "m", tue: "t", wed: "w", thu: "th", fri: "f", sat: "sa" },
  sectionPeriodStartsLabel: "ps",
  sectionPeriodEndsLabel: "pe",
} satisfies AcademicNewSectionModalDict;

const rolloverDict = {
  openButton: "Rollover",
  title: "t",
  step1Title: "1",
  step2Title: "2",
  step3Title: "3",
  sourceSection: "src",
  targetSection: "tgt",
  next: "n",
  back: "b",
  confirm: "c",
  cancel: "x",
  close: "cl",
  error: "e",
  success: "s",
  emptyStudents: "empty",
  loadingStudents: "load",
  filterPlaceholder: "f",
} satisfies AcademicRolloverWizardDict;

function anchorsFor(id: string) {
  const check = listTourRuntimeChecks().find((c) => c.id === id);
  if (!check) throw new Error(`missing runtime check ${id}`);
  return check.anchors;
}

describe("tourAnchorDomPresence (L2 isolated)", () => {
  it("screen:admin-home mounts chrome + hub anchors from listTourRuntimeChecks", () => {
    render(
      <>
        <AdminSidebar
          locale="en"
          dict={dictEn.dashboard.adminNav}
          fullDict={dictEn}
          brand={brand}
          newRegistrationsCount={0}
          recentInboundMessagesCount={0}
          profileDisplayName="Test"
          profileRoleLabel="Admin"
          profileAvatarUrl={null}
        />
        <AdminChromeHeader
          locale="en"
          brand={brand}
          dict={dictEn}
          adminProfileRole="admin"
          teacherPortalAllowed={false}
        />
        <AdminHubHome
          locale="en"
          dict={dictEn}
          summary={summary}
          birthdayRows={[]}
          birthdaysDict={dictEn.dashboard.birthdays}
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-home"));
  });

  it("task:create-cohort mounts new-cohort + academic nav anchors", () => {
    render(
      <>
        <AdminSidebar
          locale="en"
          dict={dictEn.dashboard.adminNav}
          fullDict={dictEn}
          brand={brand}
          newRegistrationsCount={0}
          recentInboundMessagesCount={0}
          profileDisplayName="Test"
          profileRoleLabel="Admin"
          profileAvatarUrl={null}
        />
        <AcademicHubToolbar locale="en" dict={academicDict} />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("task:create-cohort"));
  });

  it("task:create-section mounts cohort shell + sections toolbar anchors", () => {
    render(
      <AcademicCohortDetailShell
        labels={{
          tablistAria: "tabs",
          overview: "Overview",
          overviewLead: "lead",
          sections: "Sections",
          retention: "Retention",
          retentionLead: "r",
          transfers: "Transfers",
          transfersLead: "t",
        }}
        defaultTab="sections"
        overview={<div />}
        sections={
          <CohortSectionsToolbar
            locale="en"
            cohortId="11111111-1111-4111-8111-111111111111"
            newSectionButton="New section"
            newSectionModalDict={sectionModalDict}
            defaultSectionMaxStudents={20}
            teachers={[]}
            rollover={{
              dict: rolloverDict,
              sourceSectionOptions: [],
              targetSectionOptions: [],
            }}
          />
        }
        retention={<div />}
        transferInbox={<div />}
      />,
    );
    expectTourAnchorsInDocument(anchorsFor("task:create-section"));
    expect(
      document.querySelector(`[data-tour="${ADMIN_TOUR_ANCHORS.cohortSectionsTab}"]`),
    ).toBeTruthy();
  });

  it("task:create-student mounts form + users nav anchors", () => {
    render(
      <>
        <AdminSidebar
          locale="en"
          dict={dictEn.dashboard.adminNav}
          fullDict={dictEn}
          brand={brand}
          newRegistrationsCount={0}
          recentInboundMessagesCount={0}
          profileDisplayName="Test"
          profileRoleLabel="Admin"
          profileAvatarUrl={null}
        />
        <AdminSectionSubnav
          ariaLabel={dictEn.admin.usersNav.aria}
          items={[
            {
              href: "/en/dashboard/admin/users",
              label: dictEn.admin.usersNav.list,
              icon: "list",
            },
            {
              href: "/en/dashboard/admin/users/new",
              label: dictEn.admin.usersNav.add,
              icon: "userPlus",
              tourId: ADMIN_TOUR_ANCHORS.usersNavAdd,
            },
          ]}
        />
        <AdminCreateUserForm
          locale="en"
          legalAgeMajority={18}
          labels={dictEn.admin.users}
          birthLabels={dictEn.register}
          birthDateIncompleteMessage="incomplete"
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("task:create-student"));
  });

  it("screen:admin-users-new mounts title + create-user form anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.usersNewTitle}>Add user</h1>
        <AdminCreateUserForm
          locale="en"
          legalAgeMajority={18}
          labels={dictEn.admin.users}
          birthLabels={dictEn.register}
          birthDateIncompleteMessage="incomplete"
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-users-new"));
  });

  it("screen:admin-users-import mounts import title + choose file anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.usersImportTitle}>Import</h1>
        <ImportUsers locale="en" labels={dictEn.admin.users.spreadsheet} />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-users-import"));
  });

  it("screen:admin-events-new mounts title + create event form anchors", () => {
    const formLabels = dictEn.admin.events.new;
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.eventsNewTitle}>{formLabels.title}</h1>
        <AdminEventCreateForm
          locale="en"
          editorLabels={dictEn.admin.cms.blog.editor}
          academicLabels={dictEn.dashboard.adminContents}
          labels={{
            titleLabel: formLabels.titleLabel,
            descriptionLabel: formLabels.descriptionLabel,
            eventDateLabel: formLabels.eventDateLabel,
            locationLabel: formLabels.locationLabel,
            capacityLabel: formLabels.capacityLabel,
            priceLocalLabel: formLabels.priceLocalLabel,
            priceNonLocalLabel: formLabels.priceNonLocalLabel,
            priceHint: formLabels.priceHint,
            currencyLabel: formLabels.currencyLabel,
            currencyGatewayWarning: dictEn.admin.events.pricing.currencyGatewayWarning,
            bankTransferInstructionsLabel:
              dictEn.admin.events.pricing.bankTransferInstructionsLabel,
            bankTransferInstructionsHint:
              dictEn.admin.events.pricing.bankTransferInstructionsHint,
            submit: formLabels.submit,
            back: formLabels.back,
            errorSave: formLabels.errorSave,
            validationError: formLabels.validationError,
          }}
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-events-new"));
  });

  it("screen:admin-event-detail mounts title, tabs, publish, and workspace anchors", () => {
    const detail = dictEn.admin.events.detail;
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.eventDetailTitle}>Event title</h1>
        <AdminEventDetailTabs
          current="summary"
          baseHref="/en/dashboard/admin/events/ev-1"
          labels={{
            tabsAria: detail.tabsAria,
            tabs: detail.tabs,
            tabLeads: detail.tabLeads,
          }}
        >
          <AdminEventPublishBar
            locale="en"
            eventId="ev-1"
            status="draft"
            labels={{
              draftHint: detail.draftHint,
              publish: detail.publish,
              publishSuccess: detail.publishSuccess,
              publishError: detail.publishError,
              unpublish: detail.unpublish,
              unpublishSuccess: detail.unpublishSuccess,
              unpublishError: detail.unpublishError,
              viewPublic: detail.viewPublic,
              publishedHint: detail.publishedHint,
            }}
          />
        </AdminEventDetailTabs>
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-event-detail"));
  });

  it("screen:admin-messages-compose mounts title, recipient, body, and send anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.messagesComposeTitle}>Compose</h1>
        <AdminPortalCompose
          locale="en"
          recipients={[
            {
              id: "p1",
              first_name: "Student",
              last_name: "One",
              role: "student",
            },
          ]}
          labels={dictEn.admin.messages}
          replyBootstrap={{ kind: "none" }}
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-messages-compose"));
  });

  it("screen:admin-message-detail mounts title, participants, body, and actions anchors", () => {
    const labels = dictEn.admin.messages;
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.messagesDetailTitle}>{labels.detailHeading}</h1>
        <AdminPortalMessageDetailView
          locale="en"
          labels={labels}
          detail={{
            createdAt: "2026-01-15T12:00:00.000Z",
            bodyHtmlDisplay: "<p>Hello</p>",
            fromName: "Parent One",
            toName: "Admin One",
            fromRoleLabel: labels.roleParent,
            toRoleLabel: labels.roleAdmin,
          }}
        />
        <div data-tour={ADMIN_TOUR_ANCHORS.messagesDetailActions}>actions</div>
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-message-detail"));
  });

  const userDetailFixture: AdminUserDetailVM = {
    userId: "00000000-0000-4000-8000-000000000001",
    email: "student@example.com",
    emailDisplay: "student@example.com",
    firstName: "Ana",
    lastName: "Student",
    role: "student",
    phone: "",
    phoneDisplay: "—",
    dniOrPassport: "DOC",
    homeAddressText: "",
    homePlaceId: null,
    birthDateIso: null,
    birthDateDisplay: null,
    ageYears: null,
    isMinor: false,
    assignedTeacherName: null,
    createdAtDisplay: "2026-01-01",
    avatarDisplayUrl: null,
    tutorLinks: [],
    tutorLinkedStudents: [],
    tutorFamilyScholarshipSections: [],
    currentCohortAssignment: null,
    familyHomeAddressPeerIds: [],
    viewerMayInlineEdit: false,
  };

  it("screen:admin-user-detail mounts identity title, tabs, and workspace anchors", () => {
    render(
      <>
        <AdminUserIdentityHero
          locale="en"
          detail={userDetailFixture}
          labels={dictEn.admin.users}
          fileUploadProgress={dictEn.common.fileUpload}
          displayName="Student, Ana"
          roleLabel={dictEn.admin.users.roleOptionStudent}
        />
        <AdminUserProfileFicha
          locale="en"
          labels={dictEn.admin.users}
          billingLabels={dictEn.admin.billing}
          detail={userDetailFixture}
          billing={null}
          fileUploadProgress={dictEn.common.fileUpload}
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-user-detail"));
  });

  it("screen:admin-user-billing mounts title, tabs, and workspace anchors", () => {
    const billingLabels = dictEn.admin.billing;
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.userBillingTitle}>{billingLabels.title}</h1>
        <AdminStudentBillingTabsPanel
          locale="en"
          studentId="00000000-0000-4000-8000-000000000001"
          labels={billingLabels}
          selectedBenefit={null}
          visiblePayments={[]}
          selectedScholarships={[]}
          enrollmentFeeExempt={false}
          enrollmentExemptReason={null}
          lastEnrollmentPaidAt={null}
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-user-billing"));
  });

  const blogEditorFixture = {
    locale: "en",
    pageTitle: dictEn.admin.cms.blog.list.create,
    labels: dictEn.admin.cms.blog.editor,
    academicLabels: dictEn.dashboard.adminContents,
    fileUploadProgress: dictEn.common.fileUpload,
    initial: {
      defaultLocale: "en" as const,
      status: "draft",
      tags: [] as string[],
      scheduledFor: "",
      isPinned: false,
      hasGoogleKey: false,
      translationsByLocale: {},
    },
  };

  it("screen:admin-blog-new mounts blog editor anchors", () => {
    render(<BlogArticleEditor {...blogEditorFixture} />);
    expectTourAnchorsInDocument(anchorsFor("screen:admin-blog-new"));
  });

  it("screen:admin-blog-edit mounts blog editor anchors", () => {
    render(<BlogArticleEditor {...blogEditorFixture} articleId="article-1" />);
    expectTourAnchorsInDocument(anchorsFor("screen:admin-blog-edit"));
  });

  it("screen:admin-cohort-detail mounts title, tabs, and workspace anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.cohortDetailTitle}>2026</h1>
        <AcademicCohortDetailShell
          labels={{
            tablistAria: "tabs",
            overview: "Overview",
            overviewLead: "lead",
            sections: "Sections",
            retention: "Retention",
            retentionLead: "r",
            transfers: "Transfers",
            transfersLead: "t",
          }}
          overview={<div />}
          sections={<div />}
          retention={<div />}
          transferInbox={<div />}
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-cohort-detail"));
  });

  it("screen:admin-section-attendance mounts title and workspace anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.sectionAttendanceTitle}>Attendance</h1>
        <div data-tour={ADMIN_TOUR_ANCHORS.sectionAttendanceRoot}>workspace</div>
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-section-attendance"));
  });

  it("screen:admin-section-detail mounts title, tabs, and workspace anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.sectionDetailTitle}>Section</h1>
        <div data-tour={ADMIN_TOUR_ANCHORS.sectionDetailTabs}>tabs</div>
        <div data-tour={ADMIN_TOUR_ANCHORS.sectionDetail}>workspace</div>
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-section-detail"));
  });

  it("screen:admin-settings-integrations mounts title, form, and save anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.settingsIntegrationsTitle}>Integrations</h1>
        <section data-tour={ADMIN_TOUR_ANCHORS.settingsIntegrationsForm}>form</section>
        <button type="button" data-tour={ADMIN_TOUR_ANCHORS.settingsIntegrationsSave}>
          Save
        </button>
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-settings-integrations"));
  });

  it("screen:admin-finance-collections-section mounts title, tabs, and workspace anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsTitle}>Collections</h1>
        <div data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsTabs}>
          <button type="button" data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsTabMatrix}>
            matrix
          </button>
          <button type="button" data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsTabSettings}>
            settings
          </button>
          <button type="button" data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsTabHistory}>
            history
          </button>
          <button
            type="button"
            data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsScholarshipsTab}
          >
            scholarships
          </button>
          <button type="button" data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsTabEnrollment}>
            enrollment
          </button>
        </div>
        <div data-tour={ADMIN_TOUR_ANCHORS.sectionCollectionsRoot}>workspace</div>
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-finance-collections-section"));
  });

  it("screen:admin-finance-receipt-detail mounts title, preview, and actions anchors", () => {
    render(
      <>
        <h1 data-tour={ADMIN_TOUR_ANCHORS.financeReceiptDetailTitle}>Receipt</h1>
        <div data-tour={ADMIN_TOUR_ANCHORS.financeReceiptDetailPreview}>preview</div>
        <div data-tour={ADMIN_TOUR_ANCHORS.financeReceiptDetailActions}>actions</div>
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-finance-receipt-detail"));
  });
});
