"use client";

import {
  BADGE_CATEGORIES,
  BADGE_CRITERIA_TYPES,
  type BadgeCategory,
  type BadgeCriteriaType,
} from "@/lib/badges/badgeCatalog";
import type { Dictionary } from "@/types/i18n";

export type AdminBadgesDict = Dictionary["admin"]["badges"];

export const inputCls =
  "block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

function capitalize<S extends string>(s: S): Capitalize<S> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<S>;
}

function toCriteriaKey(c: BadgeCriteriaType): string {
  return c.split("_").map((s) => capitalize(s)).join("");
}

interface MetaFieldsProps {
  mode: "create" | "edit";
  labels: AdminBadgesDict;
  code: string;
  setCode: (v: string) => void;
  category: BadgeCategory;
  setCategory: (v: BadgeCategory) => void;
  criteriaType: BadgeCriteriaType;
  setCriteriaType: (v: BadgeCriteriaType) => void;
  criteriaThreshold: number;
  setCriteriaThreshold: (v: number) => void;
  sortOrder: number;
  setSortOrder: (v: number) => void;
}

export function AdminBadgeMetaFields(props: MetaFieldsProps) {
  const {
    mode,
    labels,
    code,
    setCode,
    category,
    setCategory,
    criteriaType,
    setCriteriaType,
    criteriaThreshold,
    setCriteriaThreshold,
    sortOrder,
    setSortOrder,
  } = props;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="badge-code">
          {labels.formCode}
        </label>
        <input
          id="badge-code"
          className={inputCls}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          maxLength={64}
          pattern="[a-z0-9_]+"
          disabled={mode === "edit"}
          placeholder="custom_badge_code"
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.tipCode}</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="badge-sort">
          {labels.formSortOrder}
        </label>
        <input
          id="badge-sort"
          className={inputCls}
          type="number"
          min={0}
          max={10000}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          required
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.tipSortOrder}</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="badge-category">
          {labels.formCategory}
        </label>
        <select
          id="badge-category"
          className={inputCls}
          value={category}
          onChange={(e) => setCategory(e.target.value as BadgeCategory)}
        >
          {BADGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {labels[`category${capitalize(c)}` as `categoryTasks`]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="badge-criteria">
          {labels.formCriteriaType}
        </label>
        <select
          id="badge-criteria"
          className={inputCls}
          value={criteriaType}
          onChange={(e) => setCriteriaType(e.target.value as BadgeCriteriaType)}
        >
          {BADGE_CRITERIA_TYPES.map((c) => (
            <option key={c} value={c}>
              {labels[`criteria${toCriteriaKey(c)}` as `criteriaTasksCompleted`]}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.tipCriteriaType}</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="badge-threshold">
          {labels.formThreshold}
        </label>
        <input
          id="badge-threshold"
          className={inputCls}
          type="number"
          min={0}
          max={10000}
          value={criteriaThreshold}
          onChange={(e) => setCriteriaThreshold(Number(e.target.value))}
          required
        />
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.tipThreshold}</p>
      </div>
    </div>
  );
}

interface TranslationInputsProps {
  localeKey: "en" | "es";
  labels: AdminBadgesDict;
  title: string;
  description: string;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
}

export function AdminBadgeTranslationInputs({
  localeKey,
  labels,
  title,
  description,
  onTitle,
  onDescription,
}: TranslationInputsProps) {
  const headingLabel = localeKey === "en" ? labels.localeEn : labels.localeEs;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {headingLabel}
      </p>
      <input
        className={inputCls}
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder={labels.formTitle}
        aria-label={`${labels.formTitle} (${headingLabel})`}
        required
        maxLength={120}
      />
      <textarea
        className={`${inputCls} min-h-[6rem]`}
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        placeholder={labels.formDescription}
        aria-label={`${labels.formDescription} (${headingLabel})`}
        required
        maxLength={600}
      />
    </div>
  );
}
