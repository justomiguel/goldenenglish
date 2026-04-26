"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Globe2, Pencil, Route, Trash2 } from "lucide-react";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { deleteLearningRouteAction } from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

interface AdminLearningRoutesGridProps {
  locale: string;
  routes: LearningRouteContentTemplateOption[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminLearningRoutesGrid({ locale, routes, labels }: AdminLearningRoutesGridProps) {
  const router = useRouter();
  const [routeToDelete, setRouteToDelete] = useState<LearningRouteContentTemplateOption | null>(null);
  const [actionError, setActionError] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href={`/${locale}/dashboard/admin/academic/contents/sections/new/edit`}
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[var(--color-muted)]"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
            <Globe2 className="h-4 w-4 shrink-0" aria-hidden />
            {labels.newLearningRouteOption}
          </span>
          <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{labels.newLearningRouteLead}</span>
        </Link>
        {routes.map((route) => (
          <article
            key={route.id}
            className="relative rounded-[var(--layout-border-radius)] border border-[var(--color-primary)] bg-[var(--color-muted)] p-4 pr-24 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
          >
            <Link
              href={`/${locale}/dashboard/admin/academic/contents/sections/${route.id}/edit`}
              className="block rounded-[var(--layout-border-radius)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-[var(--color-foreground)]">
                <Route className="h-4 w-4 shrink-0" aria-hidden />
                {route.title}
              </span>
              <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">
                {route.description || labels.noDescription}
              </span>
            </Link>
            <div className="absolute right-3 top-3 flex items-center gap-1">
              <Link
                href={`/${locale}/dashboard/admin/academic/contents/sections/${route.id}/edit`}
                aria-label={`${labels.editLearningRouteAria}: ${route.title}`}
                title={labels.editLearningRouteAria}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] transition hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                aria-label={`${labels.deleteLearningRouteAria}: ${route.title}`}
                title={labels.deleteLearningRouteAria}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)] transition hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-error)]"
                onClick={() => {
                  setActionError(false);
                  setRouteToDelete(route);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </article>
        ))}
      </section>
      {routes.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.emptyLearningRoutes}</p>
      ) : null}
      {actionError ? (
        <p className="text-sm font-medium text-[var(--color-error)]" role="alert">{labels.deleteLearningRouteError}</p>
      ) : null}
      <ConfirmActionModal
        open={routeToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setRouteToDelete(null);
        }}
        title={labels.deleteLearningRouteTitle}
        description={labels.deleteLearningRouteDescription}
        body={routeToDelete?.title}
        cancelLabel={labels.cancel}
        confirmLabel={labels.delete}
        confirmVariant="destructive"
        busy={isPending}
        disableClose={isPending}
        onConfirm={() => {
          if (!routeToDelete) return;
          const routeId = routeToDelete.id;
          startTransition(() => {
            void (async () => {
              const result = await deleteLearningRouteAction({ locale, routeId });
              if (!result.ok) {
                setActionError(true);
                return;
              }
              setRouteToDelete(null);
              router.refresh();
            })();
          });
        }}
      />
    </div>
  );
}
