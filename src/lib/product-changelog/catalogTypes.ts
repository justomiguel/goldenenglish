import type { Locale } from "@/types/i18n";

export const PRODUCT_CHANGELOG_AREAS = [
  "academic",
  "finance",
  "registrations",
  "parent",
  "portal",
  "events",
  "cms",
  "admin",
  "communications",
  "site",
] as const;

export type ProductChangelogArea = (typeof PRODUCT_CHANGELOG_AREAS)[number];

export type LocalizedChangelogText = {
  es: string;
  en: string;
  pt: string;
};

export type ProductChangelogEntry = {
  id: string;
  date: string;
  area: ProductChangelogArea;
  title: LocalizedChangelogText;
  summary: LocalizedChangelogText;
};

export const changelogT = (es: string, en: string, pt: string): LocalizedChangelogText => ({
  es,
  en,
  pt,
});

export type { Locale };
