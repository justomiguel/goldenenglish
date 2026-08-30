import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { ENTRIES as ENTRIES_1 } from "@/lib/product-changelog/catalogEntries1";
import { ENTRIES as ENTRIES_2 } from "@/lib/product-changelog/catalogEntries2";
import { ENTRIES as ENTRIES_3 } from "@/lib/product-changelog/catalogEntries3";
import { ENTRIES as ENTRIES_4 } from "@/lib/product-changelog/catalogEntries4";

export const PRODUCT_CHANGELOG_ENTRIES: readonly ProductChangelogEntry[] = [
  ...ENTRIES_1, ...ENTRIES_2, ...ENTRIES_3, ...ENTRIES_4,
];
