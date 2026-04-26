"use client";

import { useState } from "react";
import { AdminGlobalContentRepository } from "@/components/admin/AdminGlobalContentRepository";
import { AdminSectionContentPlanner } from "@/components/admin/AdminSectionContentPlanner";
import type { ContentSectionOption } from "@/types/learningContent";
import type { SectionContentWorkspace } from "@/lib/learning-content/loadSectionContentWorkspace";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";

type ContentMode = "home" | "global" | "section" | "repository";

interface AdminAcademicContentsScreenProps {
  locale: string;
  sections: ContentSectionOption[];
  selectedSectionId: string | null;
  workspace: SectionContentWorkspace | null;
  globalContents: ContentTemplateLibraryRow[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminAcademicContentsScreen({
  locale,
  sections,
  selectedSectionId,
  workspace,
  globalContents,
  labels,
}: AdminAcademicContentsScreenProps) {
  const [mode, setMode] = useState<ContentMode>("home");
  return (
    <div className="space-y-6">
      <header className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.title}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        <ModeCard active={mode === "global"} title={labels.globalModeTitle} body={labels.globalModeLead} onClick={() => setMode("global")} />
        <ModeCard active={mode === "section"} title={labels.sectionModeTitle} body={labels.sectionModeLead} onClick={() => setMode("section")} />
        <ModeCard active={mode === "repository"} title={labels.repositoryModeTitle} body={labels.repositoryModeLead} onClick={() => setMode("repository")} />
      </div>
      {mode === "home" ? (
        <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-5 text-sm text-[var(--color-muted-foreground)]">
          {labels.homePrompt}
        </section>
      ) : null}
      {mode === "global" || mode === "repository" ? (
        <AdminGlobalContentRepository locale={locale} contents={globalContents} labels={labels} />
      ) : null}
      {mode === "section" ? (
        <AdminSectionContentPlanner
          locale={locale}
          sections={sections}
          selectedSectionId={selectedSectionId}
          workspace={workspace}
          labels={labels}
        />
      ) : null}
    </div>
  );
}

function ModeCard({ active, title, body, onClick }: {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--layout-border-radius)] border p-4 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:bg-[var(--color-muted)] ${active ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-background)]"}`}
    >
      <span className="block text-base font-semibold text-[var(--color-foreground)]">{title}</span>
      <span className="mt-2 block text-sm text-[var(--color-muted-foreground)]">{body}</span>
    </button>
  );
}
