"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { createCourseAction } from "@/app/[locale]/dashboard/admin/academic/contents/courseActions";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

type LessonDraft = { title: string; contentTemplateId: string };
type ModuleDraft = { title: string; lessons: LessonDraft[] };

interface AdminCourseCreateFormProps {
  locale: string;
  templates: { id: string; title: string }[];
  labels: Labels;
}

function blankLesson(templateId: string, title: string): LessonDraft {
  return { title, contentTemplateId: templateId };
}

export function AdminCourseCreateForm({ locale, templates, labels }: AdminCourseCreateFormProps) {
  const router = useRouter();
  const first = templates[0];
  const [title, setTitle] = useState("");
  const [progressMode, setProgressMode] = useState<"open" | "sequential">("open");
  const [price, setPrice] = useState("0");
  const [listedInShop, setListedInShop] = useState(false);
  const [modules, setModules] = useState<ModuleDraft[]>([
    { title: "", lessons: [blankLesson(first?.id ?? "", first?.title ?? "")] },
  ]);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!first) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{labels.courseNeedItem}</p>;
  }

  function updateLesson(moduleIndex: number, lessonIndex: number, patch: Partial<LessonDraft>) {
    setModules((current) =>
      current.map((module, index) =>
        index === moduleIndex
          ? {
              ...module,
              lessons: module.lessons.map((lesson, inner) => (inner === lessonIndex ? { ...lesson, ...patch } : lesson)),
            }
          : module,
      ),
    );
  }

  async function submit() {
    setPending(true);
    setFailed(false);
    const result = await createCourseAction({
      locale,
      title,
      progressMode,
      price: Number(price) || 0,
      listedInShop,
      modules: modules.map((module) => ({
        title: module.title.trim() || title.trim(),
        lessons: module.lessons,
      })),
    });
    setPending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setTitle("");
    setListedInShop(false);
    setPrice("0");
    setModules([{ title: "", lessons: [blankLesson(first.id, first.title)] }]);
    router.refresh();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.courseTitle}
        <input
          required
          value={title}
          maxLength={180}
          onChange={(event) => setTitle(event.target.value)}
          className="block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.courseMode}
        <select
          value={progressMode}
          onChange={(event) => setProgressMode(event.target.value === "sequential" ? "sequential" : "open")}
          className="block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        >
          <option value="open">{labels.courseModeOpen}</option>
          <option value="sequential">{labels.courseModeSequential}</option>
        </select>
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.coursePrice}
        <input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        />
      </label>
      <label className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
        <input type="checkbox" checked={listedInShop} onChange={(event) => setListedInShop(event.target.checked)} />
        {labels.courseListed}
      </label>
      {modules.map((module, moduleIndex) => (
        <fieldset key={moduleIndex} className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-3">
          <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
            {labels.courseModuleTitle}
            <input
              value={module.title}
              maxLength={180}
              onChange={(event) =>
                setModules((current) =>
                  current.map((row, index) => (index === moduleIndex ? { ...row, title: event.target.value } : row)),
                )
              }
              className="block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            />
          </label>
          {module.lessons.map((lesson, lessonIndex) => (
            <div key={lessonIndex} className="grid gap-2 sm:grid-cols-2">
              <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
                {labels.courseLessonTitle}
                <input
                  required
                  value={lesson.title}
                  maxLength={180}
                  onChange={(event) => updateLesson(moduleIndex, lessonIndex, { title: event.target.value })}
                  className="block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
                {labels.courseLessonItem}
                <select
                  value={lesson.contentTemplateId}
                  onChange={(event) => {
                    const template = templates.find((row) => row.id === event.target.value);
                    updateLesson(moduleIndex, lessonIndex, {
                      contentTemplateId: event.target.value,
                      title: lesson.title || template?.title || "",
                    });
                  }}
                  className="block w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setModules((current) =>
                current.map((row, index) =>
                  index === moduleIndex
                    ? { ...row, lessons: [...row.lessons, blankLesson(first.id, first.title)] }
                    : row,
                ),
              )
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            {labels.courseAddLesson}
          </Button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setModules((current) => [...current, { title: "", lessons: [blankLesson(first.id, first.title)] }])
          }
        >
          <Plus className="h-4 w-4" aria-hidden />
          {labels.courseAddModule}
        </Button>
        <Button type="submit" disabled={pending}>
          <Plus className="h-4 w-4" aria-hidden />
          {pending ? labels.courseCreating : labels.courseCreate}
        </Button>
      </div>
      {failed ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {labels.courseCreateFailed}
        </p>
      ) : null}
    </form>
  );
}
