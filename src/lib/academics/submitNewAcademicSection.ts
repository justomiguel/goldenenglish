import { createAcademicSectionAction } from "@/app/[locale]/dashboard/admin/academic/sectionActions";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
import type { SectionScheduleSlot } from "@/types/academics";

export async function submitNewAcademicSection(input: {
  locale: string;
  cohortId: string;
  name: string;
  teacherId: string;
  startsOn: string;
  endsOn: string;
  maxStudents: number | null;
  scheduleSlots: SectionScheduleSlot[];
  photo: File | null;
  onReadProgress: (pct: number) => void;
  onPhase: (phase: "reading" | "sending" | "idle") => void;
}): Promise<{ ok: true; id: string; imageSaved: boolean } | { ok: false }> {
  let imageBase64: string | undefined;
  let imageMime: string | undefined;
  if (input.photo) {
    input.onPhase("reading");
    const read = await readImageFileAsBase64(input.photo, {
      onProgress: (ratio) => input.onReadProgress(Math.round(ratio * 100)),
    });
    imageBase64 = read.base64;
    imageMime = read.mime;
  }
  input.onPhase("sending");
  const r = await createAcademicSectionAction({
    locale: input.locale,
    cohortId: input.cohortId,
    name: input.name,
    teacherId: input.teacherId,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    maxStudents: input.maxStudents,
    scheduleSlots: input.scheduleSlots,
    ...(imageBase64 && imageMime ? { imageBase64, imageMime } : {}),
  });
  input.onPhase("idle");
  return r.ok ? r : { ok: false };
}
