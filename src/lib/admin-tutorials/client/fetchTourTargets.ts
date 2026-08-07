export type AttendanceTarget = {
  cohortId: string | null;
  sectionId: string | null;
};

export async function fetchAttendanceTarget(): Promise<AttendanceTarget | null> {
  try {
    const res = await fetch("/api/admin/tutorials/attendance-target", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AttendanceTarget;
    return data;
  } catch {
    return null;
  }
}

export type ScholarshipTarget = {
  studentId: string | null;
};

export async function fetchScholarshipTarget(): Promise<ScholarshipTarget | null> {
  try {
    const res = await fetch("/api/admin/tutorials/scholarship-target", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ScholarshipTarget;
  } catch {
    return null;
  }
}

export type EventTarget = {
  eventId: string | null;
};

export async function fetchEventTarget(): Promise<EventTarget | null> {
  try {
    const res = await fetch("/api/admin/tutorials/event-target", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as EventTarget;
  } catch {
    return null;
  }
}
