import { describe, it, expect } from "vitest";
import {
  defaultLocale,
  getDictionary,
  locales,
} from "@/lib/i18n/dictionaries";

describe("getDictionary", () => {
  it("returns es dictionary for es", async () => {
    const d = await getDictionary("es");
    expect(d.common.submit.length).toBeGreaterThan(0);
  });

  it("returns en dictionary for en", async () => {
    const d = await getDictionary("en");
    expect(d.common.submit.length).toBeGreaterThan(0);
  });

  it("includes academicSectionPage.scheduleEditor in en and es", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    expect(en.dashboard.academicSectionPage.scheduleEditor?.scheduleTitle).toBeTruthy();
    expect(es.dashboard.academicSectionPage.scheduleEditor?.scheduleTitle).toBeTruthy();
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

  it("includes academic section shell tabs copy in en and es", async () => {
    const en = await getDictionary("en");
    const es = await getDictionary("es");
    expect(en.dashboard.academicSectionPage.period.save).toBeTruthy();
    expect(es.dashboard.academicSectionPage.period.save).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staff.leadSave).toBeTruthy();
    expect(es.dashboard.academicSectionPage.staff.assistantsSave).toBeTruthy();
    expect(en.dashboard.academicSectionPage.staff.pickStaffAssistantLabel).toBeTruthy();
    expect(en.dashboard.academicSectionPage.capacity.save).toBeTruthy();
    expect(es.dashboard.academicSectionPage.capacity.save).toBeTruthy();
    expect(en.admin.users.roleOptionAssistant).toBeTruthy();
    expect(en.dashboard.academicSectionPage.shellTabs.roster).toBeTruthy();
    expect(es.dashboard.academicSectionPage.shellTabs.roster).toBeTruthy();
    expect(en.dashboard.academicSectionPage.shellTabs.generalLead.length).toBeGreaterThan(10);
    expect(es.dashboard.academicSectionPage.shellTabs.generalLead.length).toBeGreaterThan(10);
  });

  it("falls back to default for unknown locale", async () => {
    const d = await getDictionary("xx");
    const fallback = await getDictionary(defaultLocale);
    expect(d.common.submit).toEqual(fallback.common.submit);
  });

  it("exports locale list", () => {
    expect(locales).toContain("en");
    expect(defaultLocale).toBe("es");
  });
});
