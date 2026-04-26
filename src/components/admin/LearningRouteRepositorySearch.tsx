"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/atoms/Input";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

interface LearningRouteRepositorySearchProps {
  templates: LearningRouteContentTemplateOption[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function LearningRouteRepositorySearch({ templates, labels }: LearningRouteRepositorySearchProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates.slice(0, 30);
    return templates
      .filter((template) => `${template.title} ${template.description}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [query, templates]);

  return (
    <aside className="flex min-h-0 flex-col gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.routeGraphRepositoryTitle}</h3>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.routeGraphRepositoryLead}</p>
      </div>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" aria-hidden />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.routeGraphSearchPlaceholder}
          className="pl-9"
        />
      </label>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {filtered.map((template) => (
          <div
            key={template.id}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("application/x-learning-content-template", JSON.stringify(template));
              event.dataTransfer.effectAllowed = "copy";
            }}
            className="cursor-grab rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-sm shadow-sm active:cursor-grabbing"
          >
            <p className="font-medium text-[var(--color-foreground)]">{template.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">
              {template.description || labels.noDescription}
            </p>
          </div>
        ))}
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.routeGraphRepositoryEmpty}</p>
        ) : null}
      </div>
    </aside>
  );
}
