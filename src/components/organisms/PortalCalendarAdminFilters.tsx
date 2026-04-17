"use client";

import { useRouter } from "next/navigation";
import type { PortalCalendarTeacherOption } from "@/types/portalCalendar";

type FilterDict = {
  teacherLabel: string;
  roomLabel: string;
  all: string;
  apply: string;
};

export interface PortalCalendarAdminFiltersProps {
  locale: string;
  teachers: PortalCalendarTeacherOption[];
  rooms: string[];
  teacherId: string;
  room: string;
  dict: FilterDict;
}

export function PortalCalendarAdminFilters({
  locale,
  teachers,
  rooms,
  teacherId,
  room,
  dict,
}: PortalCalendarAdminFiltersProps) {
  const router = useRouter();

  const push = (nextTeacher: string, nextRoom: string) => {
    const p = new URLSearchParams();
    if (nextTeacher.trim()) p.set("teacher", nextTeacher.trim());
    if (nextRoom.trim()) p.set("room", nextRoom.trim());
    const q = p.toString();
    router.push(`/${locale}/dashboard/admin/calendar${q ? `?${q}` : ""}`);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="min-w-[12rem] flex-1">
        <label className="block text-xs font-medium text-[var(--color-muted-foreground)]" htmlFor="cal-filter-teacher">
          {dict.teacherLabel}
        </label>
        <select
          id="cal-filter-teacher"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={teacherId}
          onChange={(e) => push(e.target.value, room)}
        >
          <option value="">{dict.all}</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[12rem] flex-1">
        <label className="block text-xs font-medium text-[var(--color-muted-foreground)]" htmlFor="cal-filter-room">
          {dict.roomLabel}
        </label>
        <select
          id="cal-filter-room"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={room}
          onChange={(e) => push(teacherId, e.target.value)}
          disabled={rooms.length === 0}
        >
          <option value="">{dict.all}</option>
          {rooms.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
