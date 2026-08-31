import { describe, it, expect } from "vitest";
import {
  defaultLocale,
  getDictionary,
  locales,
} from "@/lib/i18n/dictionaries";

describe("getDictionary", () => {
  /** First dynamic load of full JSON can exceed 5s under slow CPU / parallel vitest workers. */
  it(
    "returns es dictionary for es",
    async () => {
      const d = await getDictionary("es");
      expect(d.common.submit.length).toBeGreaterThan(0);
    },
    15_000,
  );

  it(
    "returns en dictionary for en",
    async () => {
      const d = await getDictionary("en");
      expect(d.common.submit.length).toBeGreaterThan(0);
    },
    15_000,
  );

  it(
    "returns pt dictionary for pt",
    async () => {
      const d = await getDictionary("pt");
      expect(d.common.submit.length).toBeGreaterThan(0);
    },
    15_000,
  );

  it("includes academicSectionPage.scheduleEditor in en, es, and pt", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    const pt = await getDictionary("pt");
    expect(en.dashboard.academicSectionPage.scheduleEditor?.scheduleTitle).toBeTruthy();
    expect(es.dashboard.academicSectionPage.scheduleEditor?.scheduleTitle).toBeTruthy();
    expect(pt.dashboard.academicSectionPage.scheduleEditor?.scheduleTitle).toBeTruthy();
  });

  it("includes academic cohort and section lifecycle copy in en and es", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    expect(en.dashboard.academicCohortPage.lifecycle.archiveButton).toBeTruthy();
    expect(es.dashboard.academicCohortPage.lifecycle.archiveButton).toBeTruthy();
    expect(en.dashboard.academicCohortPage.shellTabs.overview).toBeTruthy();
    expect(es.dashboard.academicCohortPage.shellTabs.sections).toBeTruthy();
    expect(en.dashboard.academicSectionPage.lifecycle.deleteButton).toBeTruthy();
    expect(es.dashboard.academicSectionPage.lifecycle.deleteButton).toBeTruthy();
    expect(en.dashboard.academicSectionPage.lifecycle.modalDeleteBodyWithEnrollments).toBeTruthy();
    expect(es.dashboard.academicSectionPage.lifecycle.deleteConfirmCheckboxWithEnrollments).toBeTruthy();
    expect(en.dashboard.academicSectionPage.lifecycle.enrollmentStatus.active).toBeTruthy();
  });

  it("includes academic hub board and open cohort title in en and es", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    expect(en.dashboard.academicHub.board.currentTitle).toBeTruthy();
    expect(es.dashboard.academicHub.board.currentTitle).toBeTruthy();
    expect(en.dashboard.academicHub.board.tabs.current).toBeTruthy();
    expect(es.dashboard.academicHub.board.tabs.active).toBeTruthy();
    expect(en.dashboard.academicHub.table.openCohortTitle).toBeTruthy();
    expect(es.dashboard.academicHub.table.openCohortTitle).toBeTruthy();
  });

  it("includes section photo copy in en, es, and pt", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    const pt = await getDictionary("pt");
    expect(en.dashboard.academicCohortPage.newSectionModal.photoLabel).toBeTruthy();
    expect(es.dashboard.academicCohortPage.newSectionModal.photoLabel).toBeTruthy();
    expect(pt.dashboard.academicCohortPage.newSectionModal.photoLabel).toBeTruthy();
    expect(en.dashboard.academicSectionPage.referenceImage.replace).toBeTruthy();
    expect(es.dashboard.academicSectionPage.referenceImage.remove).toBeTruthy();
    expect(pt.dashboard.academicSectionPage.referenceImage.empty).toBeTruthy();
  });

  it("includes academic section shell tabs copy in en and es", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    expect(en.dashboard.academicSectionPage.period.save).toBeTruthy();
    expect(es.dashboard.academicSectionPage.period.save).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staff.leadSave).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staff.leadOpenButton).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staff.assistantsOpenButton).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staff.externalOpenButton).toBeTruthy();
    expect(es.dashboard.academicSectionPage.staff.leadOpenButton).toBeTruthy();
    expect(es.dashboard.academicSectionPage.staff.assistantsOpenButton).toBeTruthy();
    expect(es.dashboard.academicSectionPage.staff.externalOpenButton).toBeTruthy();
    expect(es.dashboard.academicSectionPage.staff.assistantsSave).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staff.pickStaffAssistantLabel).toBeTruthy();
    expect(en.dashboard.academicSectionPage.capacity.save).toBeTruthy();
    expect(es.dashboard.academicSectionPage.capacity.save).toBeTruthy();
    expect(en.admin.users.roleOptionAssistant).toBeTruthy();
    expect(en.dashboard.academicSectionPage.shellTabs.students).toBeTruthy();
    expect(es.dashboard.academicSectionPage.shellTabs.students).toBeTruthy();
    expect(en.dashboard.academicSectionPage.shellTabs.studentsLead.length).toBeGreaterThan(10);
    expect(es.dashboard.academicSectionPage.shellTabs.studentsLead.length).toBeGreaterThan(10);
    expect(en.dashboard.academicSectionPage.shellTabs.generalLead.length).toBeGreaterThan(10);
    expect(es.dashboard.academicSectionPage.shellTabs.generalLead.length).toBeGreaterThan(10);
    expect(en.dashboard.academicSectionPage.shellTabs.fees).toBeTruthy();
    expect(es.dashboard.academicSectionPage.shellTabs.fees).toBeTruthy();
    expect(en.dashboard.academicSectionPage.shellTabs.feesLead.length).toBeGreaterThan(10);
    expect(es.dashboard.academicSectionPage.shellTabs.feesLead.length).toBeGreaterThan(10);
    expect(en.dashboard.academicSectionPage.shellTabs.configuration).toBeTruthy();
    expect(es.dashboard.academicSectionPage.shellTabs.configuration).toBeTruthy();
    expect(en.dashboard.academicSectionPage.shellTabs.evaluations).toBeTruthy();
    expect(es.dashboard.academicSectionPage.shellTabs.evaluations).toBeTruthy();
    expect(en.dashboard.academicSectionPage.assessmentsPanel?.titleLearning).toBeTruthy();
    expect(es.dashboard.academicSectionPage.assessmentsPanel?.titleLearning).toBeTruthy();
    expect(en.dashboard.academicSectionPage.shellTabs.teachers).toBeTruthy();
    expect(es.dashboard.academicSectionPage.shellTabs.teachers).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staffAssignedChips.heading).toBeTruthy();
    expect(es.dashboard.academicSectionPage.staffAssignedChips.heading).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staffAssignedChips.openProfileAria).toContain("{name}");
    expect(es.dashboard.academicSectionPage.staffAssignedChips.emailLabel).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staffAssignedChips.assistantBadgeTeacher).toBeTruthy();
    expect(en.dashboard.academicSectionPage.health.title).toBeTruthy();
    expect(es.dashboard.academicSectionPage.health.title).toBeTruthy();
  });

  it("gives studentNav every key parentNav has, in all locales", async () => {
    for (const locale of ["es", "en", "pt"] as const) {
      const d = await getDictionary(locale);
      const parentKeys = Object.keys(d.dashboard.parentNav);
      const studentNav = d.dashboard.studentNav as Record<string, string>;
      const missing = parentKeys.filter((key) => !(key in studentNav));
      expect(missing, `${locale} studentNav is missing keys`).toEqual([]);
      for (const key of parentKeys) {
        expect(studentNav[key], `${locale} studentNav.${key}`).toBeTruthy();
      }
    }
  });

  it("includes directory filter copy in en, es, and pt", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    const pt = await getDictionary("pt");
    expect(en.admin.directoryFilters.toggle).toBeTruthy();
    expect(es.admin.directoryFilters.clear).toBeTruthy();
    expect(pt.admin.directoryFilters.optionWithCount).toContain("{{count}}");
  });

  it("includes public CTA and trial-class copy in en, es, and pt", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    const pt = await getDictionary("pt");
    expect(en.landing.hero.ctaTrialClass).toBeTruthy();
    expect(es.landing.hero.ctaTrialClass).toBeTruthy();
    expect(pt.landing.hero.ctaTrialClass).toBeTruthy();
    expect(en.landing.nago.hero.ctaReserve).toBeTruthy();
    expect(es.landing.nago.hero.ctaReserve).toBeTruthy();
    expect(pt.landing.nago.hero.ctaReserve).toBeTruthy();
    expect(en.landing.nago.hero.ctaTrial).toBeTruthy();
    expect(es.landing.nago.hero.ctaTrial).toBeTruthy();
    expect(pt.landing.nago.hero.ctaTrial).toBeTruthy();
    expect(en.admin.settings.publicCtaBoth).toBeTruthy();
    expect(es.admin.settings.publicCtaBoth).toBeTruthy();
    expect(pt.admin.settings.publicCtaBoth).toBeTruthy();
    expect(en.register.trial.shellTitle).toBeTruthy();
    expect(es.register.trial.shellTitle).toBeTruthy();
    expect(pt.register.trial.shellTitle).toBeTruthy();
  });

  it("includes privacy page and consent copy in en, es, and pt", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    const pt = await getDictionary("pt");
    expect(en.privacy.sections.who.body).toBeTruthy();
    expect(es.privacy.sections.who.body).toBeTruthy();
    expect(pt.privacy.sections.who.body).toBeTruthy();
    expect(en.privacy.sections.controller.body).toContain("{{brand}}");
    expect(es.privacy.controller.emailLabel).toBeTruthy();
    expect(pt.privacy.sections.retention.title).toBeTruthy();
    expect(en.register.privacyConsent.label).toContain("{privacyLink}");
    expect(es.register.privacyConsent.link).toBeTruthy();
    expect(pt.register.privacyConsent.link).toBeTruthy();
    expect(en.admin.registrations.privacyAcceptedOn).toContain("{date}");
    expect(es.admin.registrations.privacyAcceptedOn).toContain("{date}");
    expect(pt.admin.registrations.privacyAcceptedOn).toContain("{date}");
    expect(en.admin.registrations.privacyPolicyVersion).toContain("{version}");
    expect(es.admin.registrations.privacyPolicyVersion).toContain("{version}");
    expect(pt.admin.registrations.privacyPolicyVersion).toContain("{version}");
  });

  it("includes Nagô extras and protocol copy in en, es, and pt", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    const pt = await getDictionary("pt");
    expect(en.register.nagoPack.stepTitle).toBeTruthy();
    expect(es.register.nagoPack.stepTitle).toBeTruthy();
    expect(pt.register.nagoPack.stepTitle).toBeTruthy();
    expect(en.register.nagoProtocol.sections.declaration.title).toBeTruthy();
    expect(es.register.nagoProtocol.sections.declaration.title).toBeTruthy();
    expect(pt.register.nagoProtocol.sections.declaration.title).toBeTruthy();
    expect(en.admin.registrations.nagoExtrasTitle).toBeTruthy();
    expect(es.admin.registrations.nagoExtrasTitle).toBeTruthy();
    expect(pt.admin.registrations.nagoExtrasTitle).toBeTruthy();
  });

  it("falls back to default for unknown locale", async () => {
    const d = await getDictionary("xx");
    const fallback = await getDictionary(defaultLocale);
    expect(d.common.submit).toEqual(fallback.common.submit);
  });

  it("exports locale list", () => {
    expect(locales).toContain("en");
    expect(locales).toContain("pt");
    expect(defaultLocale).toBe("es");
  });
});
