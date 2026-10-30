"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { grantCourseToStudentAction } from "@/app/[locale]/dashboard/admin/academic/contents/assignCourseAction";
import type { AdminCourseListRow } from "@/lib/courses/loadAdminCourses";
import type { Dictionary } from "@/types/i18n";

interface AdminCourseGrantFormProps {
  locale: string;
  courses: AdminCourseListRow[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminCourseGrantForm({ locale, courses, labels }: AdminCourseGrantFormProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (courses.length === 0) return null;

  async function submit() {
    setPending(true);
    setFailed(false);
    const result = await grantCourseToStudentAction({ locale, courseId, email });
    setPending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setEmail("");
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
        {labels.courseGrantEmail}
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="block min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3"
        />
      </label>
      <Button type="submit" disabled={pending}>
        <UserPlus className="h-4 w-4" aria-hidden />
        {labels.courseGrant}
      </Button>
      {failed ? (
        <p className="text-sm text-[var(--color-error)] sm:col-span-3" role="alert">
          {labels.courseGrantFailed}
        </p>
      ) : null}
    </form>
  );
}
