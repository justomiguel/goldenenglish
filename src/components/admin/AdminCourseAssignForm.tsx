"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { assignCourseToSectionAction } from "@/app/[locale]/dashboard/admin/academic/contents/assignCourseAction";
import type { AdminCourseListRow } from "@/lib/courses/loadAdminCourses";
import type { Dictionary } from "@/types/i18n";

interface AdminCourseAssignFormProps {
  locale: string;
  courses: AdminCourseListRow[];
  sections: { id: string; name: string }[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminCourseAssignForm({ locale, courses, sections, labels }: AdminCourseAssignFormProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (courses.length === 0 || sections.length === 0) return null;

  async function submit() {
    setPending(true);
    setFailed(false);
    const result = await assignCourseToSectionAction({ locale, courseId, sectionId });
    setPending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    router.refresh();
  }

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.courseTitle}
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          className="block min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3"
        >
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
        {labels.courseAssignSection}
        <select
          value={sectionId}
          onChange={(event) => setSectionId(event.target.value)}
          className="block min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3"
        >
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={pending}>
        <Link2 className="h-4 w-4" aria-hidden />
        {labels.courseAssign}
      </Button>
      {failed ? (
        <p className="text-sm text-[var(--color-error)] sm:col-span-3" role="alert">
          {labels.courseAssignFailed}
        </p>
      ) : null}
    </form>
  );
}
