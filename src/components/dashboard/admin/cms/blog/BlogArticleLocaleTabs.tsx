"use client";

import { useId } from "react";
import { Globe } from "lucide-react";
import {
  UnderlineTabBar,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";

interface BlogArticleLocaleTabsProps {
  value: BlogLocale;
  onChange: (locale: BlogLocale) => void;
  ariaLabel: string;
  tabLabels: Record<BlogLocale, string>;
  localeHasContent: Record<BlogLocale, boolean>;
}

export function BlogArticleLocaleTabs({
  value,
  onChange,
  ariaLabel,
  tabLabels,
  localeHasContent,
}: BlogArticleLocaleTabsProps) {
  const idPrefix = useId().replace(/:/g, "");

  const items: readonly UnderlineTabItem[] = BLOG_LOCALES.map((locale) => ({
    id: locale,
    label: localeHasContent[locale] ? `${tabLabels[locale]} ✓` : tabLabels[locale],
    Icon: Globe,
  }));

  return (
    <UnderlineTabBar
      idPrefix={idPrefix}
      ariaLabel={ariaLabel}
      items={items}
      value={value}
      onChange={(id) => onChange(id as BlogLocale)}
    />
  );
}
