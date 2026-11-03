"use client";

import { useState } from "react";
import { Route, Share2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  assignProgramToSectionAction,
  createLearningProgramAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/catalogActions";
import type { CourseCatalogSetup } from "@/lib/courses/loadCourseCatalogSetup";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];
const fieldClass =
  "block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2";

interface AdminCourseProgramFormsProps {
  locale: string;
  catalog: CourseCatalogSetup;
  sections: { id: string; name: string }[];
  labels: Labels;
  pending: boolean;
  onRun: (task: () => Promise<{ ok: boolean }>) => Promise<void>;
}

export function AdminCourseProgramForms({ locale, catalog, sections, labels, pending, onRun }: AdminCourseProgramFormsProps) {
  return (
    <>
      <ProgramForm locale={locale} catalog={catalog} labels={labels} pending={pending} onRun={onRun} />
      <AssignForm locale={locale} catalog={catalog} sections={sections} labels={labels} pending={pending} onRun={onRun} />
    </>
  );
}

function ProgramForm({
  locale,
  catalog,
  labels,
  pending,
  onRun,
}: Omit<AdminCourseProgramFormsProps, "sections">) {
  const [title, setTitle] = useState("");
  const [setName, setSetName] = useState("");
  const [completion, setCompletion] = useState<"all_in_order" | "all_any_order" | "at_least">("all_in_order");
  const [atLeastCount, setAtLeastCount] = useState("1");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onRun(() =>
          createLearningProgramAction({
            locale,
            title,
            sets: [
              {
                title: setName || title,
                completion,
                atLeastCount: completion === "at_least" ? Number(atLeastCount) || 1 : null,
                courseIds,
              },
            ],
          }),
        );
      }}
    >
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogProgramTitle}
        <input required className={fieldClass} value={title} maxLength={180} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogProgramSetTitle}
        <input className={fieldClass} value={setName} maxLength={180} onChange={(event) => setSetName(event.target.value)} />
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogProgramCompletion}
        <select className={fieldClass} value={completion} onChange={(event) => setCompletion(event.target.value as typeof completion)}>
          <option value="all_in_order">{labels.catalogProgramAllInOrder}</option>
          <option value="all_any_order">{labels.catalogProgramAllAnyOrder}</option>
          <option value="at_least">{labels.catalogProgramAtLeast}</option>
        </select>
      </label>
      {completion === "at_least" ? (
        <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
          {labels.catalogProgramAtLeastCount}
          <input className={fieldClass} type="number" min={1} max={20} value={atLeastCount} onChange={(event) => setAtLeastCount(event.target.value)} />
        </label>
      ) : null}
      <fieldset className="space-y-2">
        <legend className="text-sm text-[var(--color-foreground)]">{labels.catalogProgramCourses}</legend>
        {catalog.courseOptions.map((course) => (
          <label key={course.id} className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={courseIds.includes(course.id)}
              onChange={(event) =>
                setCourseIds((current) =>
                  event.target.checked ? [...current, course.id].slice(0, 20) : current.filter((id) => id !== course.id),
                )
              }
            />
            {course.title}
          </label>
        ))}
      </fieldset>
      <Button type="submit" variant="secondary" disabled={pending || courseIds.length === 0}>
        <Route className="h-4 w-4" aria-hidden />
        {labels.catalogProgramCreate}
      </Button>
    </form>
  );
}

function AssignForm({
  locale,
  catalog,
  sections,
  labels,
  pending,
  onRun,
}: AdminCourseProgramFormsProps) {
  const [programId, setProgramId] = useState(catalog.programs[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  if (catalog.programs.length === 0 || sections.length === 0) return null;
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void onRun(() => assignProgramToSectionAction({ locale, programId, sectionId }));
      }}
    >
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogProgramTitle}
        <select className={fieldClass} value={programId} onChange={(event) => setProgramId(event.target.value)}>
          {catalog.programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.catalogProgramSection}
        <select className={fieldClass} value={sectionId} onChange={(event) => setSectionId(event.target.value)}>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="secondary" disabled={pending}>
        <Share2 className="h-4 w-4" aria-hidden />
        {labels.catalogProgramAssign}
      </Button>
    </form>
  );
}
