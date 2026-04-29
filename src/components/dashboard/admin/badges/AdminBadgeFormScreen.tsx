"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Award, ChevronLeft, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import type { BadgeCategory, BadgeCriteriaType } from "@/lib/badges/badgeCatalog";
import { createBadgeAction } from "@/app/[locale]/dashboard/admin/badges/createBadgeAction";
import {
  setBadgeActiveAction,
  updateBadgeAction,
} from "@/app/[locale]/dashboard/admin/badges/updateBadgeAction";
import { AdminBadgeImageEditor } from "@/components/dashboard/admin/badges/AdminBadgeImageEditor";
import {
  AdminBadgeMetaFields,
  AdminBadgeTranslationInputs,
  type AdminBadgesDict,
} from "@/components/dashboard/admin/badges/AdminBadgeFormFields";

export type AdminBadgeFormInitial = {
  id: string;
  code: string;
  category: BadgeCategory;
  criteriaType: BadgeCriteriaType;
  criteriaThreshold: number;
  sortOrder: number;
  isActive: boolean;
  imageUrl: string | null;
  titleEn: string;
  descriptionEn: string;
  titleEs: string;
  descriptionEs: string;
};

export interface AdminBadgeFormScreenProps {
  mode: "create" | "edit";
  locale: string;
  labels: AdminBadgesDict;
  adminNav: Dictionary["dashboard"]["adminNav"];
  initial: AdminBadgeFormInitial | null;
}

export function AdminBadgeFormScreen(props: AdminBadgeFormScreenProps) {
  const { mode, locale, labels, adminNav, initial } = props;
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [code, setCode] = useState(initial?.code ?? "");
  const [category, setCategory] = useState<BadgeCategory>(initial?.category ?? "tasks");
  const [criteriaType, setCriteriaType] = useState<BadgeCriteriaType>(
    initial?.criteriaType ?? "tasks_completed",
  );
  const [criteriaThreshold, setCriteriaThreshold] = useState<number>(
    initial?.criteriaThreshold ?? 1,
  );
  const [sortOrder, setSortOrder] = useState<number>(initial?.sortOrder ?? 100);
  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initial?.descriptionEn ?? "");
  const [titleEs, setTitleEs] = useState(initial?.titleEs ?? "");
  const [descriptionEs, setDescriptionEs] = useState(initial?.descriptionEs ?? "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const translations = {
        en: { title: titleEn.trim(), description: descriptionEn.trim() },
        es: { title: titleEs.trim(), description: descriptionEs.trim() },
      };
      const result =
        mode === "create"
          ? await createBadgeAction({
              locale,
              code: code.trim(),
              category,
              criteriaType,
              criteriaThreshold,
              sortOrder,
              translations,
            })
          : await updateBadgeAction({
              locale,
              badgeId: initial!.id,
              category,
              criteriaType,
              criteriaThreshold,
              sortOrder,
              translations,
            });
      if (!result.ok) {
        setError(result.message ?? labels.genericError);
        return;
      }
      setSuccess(labels.savedNotice);
      if (mode === "create" && result.badgeId) {
        router.push(`/${locale}/dashboard/admin/badges/${result.badgeId}`);
      } else {
        router.refresh();
      }
    });
  }

  function onTogglePause() {
    if (!initial) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await setBadgeActiveAction({ locale, badgeId: initial.id, isActive: !initial.isActive });
      if (!result.ok) setError(result.message ?? labels.genericError);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href={`/${locale}/dashboard/admin/badges`}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {adminNav.breadcrumbAdmin} / {labels.title}
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">
          {mode === "create" ? labels.createTitle : labels.editTitle}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.formLead}</p>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          role="status"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-foreground)]"
        >
          {success}
        </p>
      ) : null}

      {mode === "edit" && initial ? (
        <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start gap-3">
            <div
              className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-muted)]"
              aria-hidden
            >
              {initial.imageUrl ? (
                <Image src={initial.imageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <Award className="h-5 w-5 text-[var(--color-foreground)]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {labels.colCode}
              </p>
              <p className="font-mono text-sm">{initial.code}</p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                {initial.isActive ? labels.statusActive : labels.statusPaused}
              </p>
            </div>
            <div className="ml-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onTogglePause}
                disabled={pending}
              >
                {initial.isActive ? labels.pauseCta : labels.activateCta}
              </Button>
            </div>
          </div>
          <AdminBadgeImageEditor
            locale={locale}
            badgeId={initial.id}
            currentImageUrl={initial.imageUrl}
            labels={labels}
            disabled={pending}
          />
        </section>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <AdminBadgeMetaFields
          mode={mode}
          labels={labels}
          code={code}
          setCode={setCode}
          category={category}
          setCategory={setCategory}
          criteriaType={criteriaType}
          setCriteriaType={setCriteriaType}
          criteriaThreshold={criteriaThreshold}
          setCriteriaThreshold={setCriteriaThreshold}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        <fieldset className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <legend className="px-1 text-sm font-medium text-[var(--color-foreground)]">
            {labels.formTranslations}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminBadgeTranslationInputs
              localeKey="en"
              labels={labels}
              title={titleEn}
              description={descriptionEn}
              onTitle={setTitleEn}
              onDescription={setDescriptionEn}
            />
            <AdminBadgeTranslationInputs
              localeKey="es"
              labels={labels}
              title={titleEs}
              description={descriptionEs}
              onTitle={setTitleEs}
              onDescription={setDescriptionEs}
            />
          </div>
        </fieldset>

        <div className="flex items-center gap-2">
          <Button type="submit" isLoading={pending} disabled={pending}>
            <Save className="h-4 w-4 shrink-0" aria-hidden />
            {labels.saveCta}
          </Button>
        </div>
      </form>
    </div>
  );
}
