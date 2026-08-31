import type { Dictionary } from "@/types/i18n";
import type { AdminSurfaceIconId } from "@/lib/dashboard/adminSurfaceIcon";

export type AdminInstituteHubRow = {
  href: string;
  label: string;
  tip: string;
  iconId: AdminSurfaceIconId;
};

export type AdminInstituteHubGroupId = "academic" | "growth" | "site" | "dataHelp";

export type AdminInstituteHubGroup = {
  id: AdminInstituteHubGroupId;
  label: string;
  rows: AdminInstituteHubRow[];
};

export type BuildAdminInstituteHubGroupsOptions = {
  includeBlogNav?: boolean;
  includeEmailTemplatesNav?: boolean;
};

export function buildAdminInstituteHubGroups(
  base: string,
  dict: Dictionary["dashboard"]["adminNav"],
  options: BuildAdminInstituteHubGroupsOptions = {},
): AdminInstituteHubGroup[] {
  const growth: AdminInstituteHubRow[] = [
    { href: `${base}/coupons`, label: dict.coupons, tip: dict.tipCoupons, iconId: "coupons" },
    { href: `${base}/promotions`, label: dict.promotions, tip: dict.tipPromotions, iconId: "promotions" },
  ];
  if (options.includeBlogNav) {
    growth.push({
      href: `${base}/cms/blog`,
      label: dict.blog,
      tip: dict.tipBlog,
      iconId: "blog",
    });
  }

  const dataHelp: AdminInstituteHubRow[] = [
    { href: `${base}/analytics`, label: dict.analytics, tip: dict.tipAnalytics, iconId: "analytics" },
    { href: `${base}/audit`, label: dict.audit, tip: dict.tipAudit, iconId: "audit" },
    { href: `${base}/changelog`, label: dict.changelog, tip: dict.tipChangelog, iconId: "changelog" },
    { href: `${base}/glossary`, label: dict.glossary, tip: dict.tipGlossary, iconId: "glossary" },
  ];
  if (options.includeEmailTemplatesNav) {
    dataHelp.push({
      href: `${base}/communications/templates`,
      label: dict.emailTemplates,
      tip: dict.tipEmailTemplates,
      iconId: "emailTemplates",
    });
  }

  return [
    {
      id: "academic",
      label: dict.instituteHub.academic,
      rows: [
        { href: `${base}/calendar`, label: dict.calendar, tip: dict.tipCalendar, iconId: "calendar" },
        { href: `${base}/events`, label: dict.events, tip: dict.tipEvents, iconId: "events" },
        { href: `${base}/academic/contents`, label: dict.contents, tip: dict.tipContents, iconId: "contents" },
        { href: `${base}/badges`, label: dict.badges, tip: dict.tipBadges, iconId: "badges" },
      ],
    },
    { id: "growth", label: dict.instituteHub.growth, rows: growth },
    {
      id: "site",
      label: dict.instituteHub.site,
      rows: [
        { href: `${base}/cms`, label: dict.cms, tip: dict.tipCms, iconId: "cms" },
        { href: `${base}/site-setup`, label: dict.siteSetup, tip: dict.tipSiteSetup, iconId: "siteSetup" },
        { href: `${base}/settings`, label: dict.settings, tip: dict.tipSettings, iconId: "settings" },
        {
          href: `${base}/settings/questionnaires`,
          label: dict.questionnaires,
          tip: dict.tipQuestionnaires,
          iconId: "questionnaires",
        },
        { href: `${base}/users`, label: dict.allAccounts, tip: dict.tipAllAccounts, iconId: "allAccounts" },
      ],
    },
    { id: "dataHelp", label: dict.instituteHub.dataHelp, rows: dataHelp },
  ];
}
