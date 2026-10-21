import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { ENTRIES as ENTRIES_NOW } from "@/lib/product-changelog/catalogEntriesNow";
import { ENTRIES as ENTRIES_LATEST } from "@/lib/product-changelog/catalogEntriesLatest";
import { ENTRIES as ENTRIES_TAIL } from "@/lib/product-changelog/catalogEntriesTail";
import { ENTRIES as ENTRIES_1 } from "@/lib/product-changelog/catalogEntries1";
import { ENTRIES as ENTRIES_2 } from "@/lib/product-changelog/catalogEntries2";
import { ENTRIES as ENTRIES_3 } from "@/lib/product-changelog/catalogEntries3";
import { ENTRIES as ENTRIES_4 } from "@/lib/product-changelog/catalogEntries4";

export const PRODUCT_CHANGELOG_ENTRIES: readonly ProductChangelogEntry[] = [
  ...ENTRIES_NOW, ...ENTRIES_LATEST, ...ENTRIES_TAIL, ...ENTRIES_1, ...ENTRIES_2, ...ENTRIES_3, ...ENTRIES_4,
];
