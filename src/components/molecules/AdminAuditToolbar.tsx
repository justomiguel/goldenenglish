"use client";

import type { FormEvent } from "react";
import { FilterX } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

type AuditLabels = Dictionary["admin"]["audit"];

export interface AdminAuditToolbarProps {
  labels: AuditLabels;
  query: string;
  domain: string;
  action: string;
  resourceType: string;
  dateFrom: string;
  dateTo: string;
  actorId: string;
  isPending: boolean;
  onQueryChange: (value: string) => void;
  onDomainChange: (value: string) => void;
  onActionChange: (value: string) => void;
  onResourceTypeChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onActorIdChange: (value: string) => void;
  onClearDateAndActor: () => void;
  canClearDateAndActor: boolean;
}

export function AdminAuditToolbar({
  labels,
  query,
  domain,
  action,
  resourceType,
  dateFrom,
  dateTo,
  actorId,
  isPending,
  onQueryChange,
  onDomainChange,
  onActionChange,
  onResourceTypeChange,
  onDateFromChange,
  onDateToChange,
  onActorIdChange,
  onClearDateAndActor,
  canClearDateAndActor,
}: AdminAuditToolbarProps) {
  function onSubmit(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(16rem,2fr)_repeat(3,minmax(10rem,1fr))]">
        <div className="space-y-1">
          <Label htmlFor="audit-search">{labels.filterLabel}</Label>
          <Input
            id="audit-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={labels.filterPlaceholder}
            title={labels.filterTooltip}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-domain">{labels.domainFilterLabel}</Label>
          <select
            id="audit-domain"
            value={domain}
            onChange={(event) => onDomainChange(event.target.value)}
            className="min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
          >
            <option value="all">{labels.domainAll}</option>
            <option value="academic">{labels.domainAcademic}</option>
            <option value="sections">{labels.domainSections}</option>
            <option value="finance">{labels.domainFinance}</option>
            <option value="identity">{labels.domainIdentity}</option>
            <option value="communications">{labels.domainCommunications}</option>
            <option value="system">{labels.domainSystem}</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-action">{labels.actionFilterLabel}</Label>
          <Input
            id="audit-action"
            value={action}
            onChange={(event) => onActionChange(event.target.value)}
            placeholder={labels.actionFilterPlaceholder}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="audit-resource">{labels.resourceFilterLabel}</Label>
          <Input
            id="audit-resource"
            value={resourceType}
            onChange={(event) => onResourceTypeChange(event.target.value)}
            placeholder={labels.resourceFilterPlaceholder}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="audit-date-from">{labels.dateFromLabel}</Label>
            <Input
              id="audit-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => onDateFromChange(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-date-to">{labels.dateToLabel}</Label>
            <Input
              id="audit-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => onDateToChange(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="audit-actor-id">{labels.actorIdFilterLabel}</Label>
            <Input
              id="audit-actor-id"
              value={actorId}
              onChange={(event) => onActorIdChange(event.target.value)}
              placeholder={labels.actorIdFilterPlaceholder}
              title={labels.actorIdFilterTooltip}
              inputMode="text"
              autoComplete="off"
              className="font-mono text-xs"
            />
          </div>
        </div>
        <div className="flex shrink-0">
          <Button
            type="button"
            variant="secondary"
            onClick={onClearDateAndActor}
            disabled={!canClearDateAndActor}
            className="inline-flex min-h-[36px] items-center justify-center gap-2"
          >
            <FilterX className="h-4 w-4 shrink-0" aria-hidden />
            {labels.clearDateActorFilters}
          </Button>
        </div>
        {isPending ? (
          <p className="w-full text-xs text-[var(--color-muted-foreground)] md:ml-auto md:w-auto" role="status">
            {labels.loading}
          </p>
        ) : null}
      </div>
    </form>
  );
}
