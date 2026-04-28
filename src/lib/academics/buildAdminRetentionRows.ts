import { countTrailingAbsences } from "@/lib/academics/sectionAttendanceRetention";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import type { AdminRetentionCandidate } from "@/types/adminRetention";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

function digitsOnly(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  return d.length >= 8 ? d : null;
}

export type RawEnrollmentRow = {
  id: string;
  student_id: string;
  section_id: string;
  status: string;
  profiles:
    | { first_name: string; last_name: string; is_minor: boolean | null; phone: string | null }
    | { first_name: string; last_name: string; is_minor: boolean | null; phone: string | null }[]
    | null;
  academic_sections: { name: string } | { name: string }[] | null;
};

type BuildContext = {
  raw: RawEnrollmentRow[];
  avgMap: Map<string, number>;
  countsByEnrollment: Map<string, { wa: number; em: number }>;
  tutorsByStudent: Map<string, string[]>;
  profileById: Map<
    string,
    { label: string; phoneDigits: string | null; phoneDisplay: string | null }
  >;
  attByEnrollment: Map<string, { attended_on: string; status: SectionAttendanceStatusDb }[]>;
  emailByUserId: Map<string, string | null>;
};

/**
 * Construye filas de candidatos a retención a partir de matrículas crudas y mapas auxiliares.
 */
export function buildAdminRetentionRows(ctx: BuildContext): AdminRetentionCandidate[] {
  const { raw, avgMap, countsByEnrollment, tutorsByStudent, profileById, attByEnrollment, emailByUserId } =
    ctx;

  const out: AdminRetentionCandidate[] = [];

  for (const r of raw) {
    const pRaw = r.profiles;
    const p = Array.isArray(pRaw) ? pRaw[0] : pRaw;
    const studentLabel = p ? formatProfileSnakeSurnameFirst(p, r.student_id) : r.student_id;
    const secRaw = r.academic_sections;
    const sec = Array.isArray(secRaw) ? secRaw[0] : secRaw;
    const sectionName = sec?.name ?? "";

    const hist = (attByEnrollment.get(r.id) ?? []).sort((a, b) => (a.attended_on < b.attended_on ? 1 : -1));
    const trailingAbsences = countTrailingAbsences(hist);
    const avgScore = avgMap.get(r.id);
    const avg = avgScore != null && Number.isFinite(avgScore) ? avgScore : null;

    const reasons: ("absences" | "low_average")[] = [];
    if (trailingAbsences >= 2) reasons.push("absences");
    if (avg != null && avg < 6) reasons.push("low_average");
    if (reasons.length === 0) continue;

    const hasTutors = (tutorsByStudent.get(r.student_id) ?? []).length > 0;
    const studentIsAdult = p != null && !Boolean(p.is_minor);

    let guardianPhoneDigits: string | null = null;
    let guardianPhoneDisplay: string | null = null;
    let guardianLabel: string | null = null;
    let guardianEmail: string | null = null;
    let mailUserId: string | null = null;
    let mailGuardianLabel: string | null = null;
    let isSelfContact = false;

    if (hasTutors) {
      for (const tid of tutorsByStudent.get(r.student_id) ?? []) {
        const prof = profileById.get(tid);
        if (prof?.phoneDigits) {
          guardianPhoneDigits = prof.phoneDigits;
          guardianPhoneDisplay = prof.phoneDisplay;
          guardianLabel = prof.label || null;
          break;
        }
      }
      for (const tid of tutorsByStudent.get(r.student_id) ?? []) {
        const em = emailByUserId.get(tid);
        if (em) {
          guardianEmail = em;
          mailUserId = tid;
          const prof = profileById.get(tid);
          mailGuardianLabel = prof?.label ? prof.label : null;
          break;
        }
      }
    } else if (studentIsAdult) {
      isSelfContact = true;
      const d = digitsOnly(p?.phone);
      if (d) {
        guardianPhoneDigits = d;
        const phoneTrim = (p?.phone ?? "").trim();
        guardianPhoneDisplay = phoneTrim.length > 0 ? phoneTrim : d.length > 0 ? `+${d}` : null;
      }
      guardianLabel = studentLabel;
      const em = emailByUserId.get(r.student_id);
      if (em) {
        guardianEmail = em;
        mailUserId = r.student_id;
        mailGuardianLabel = studentLabel;
      }
    }

    const cnt = countsByEnrollment.get(r.id) ?? { wa: 0, em: 0 };
    out.push({
      enrollmentId: r.id,
      studentId: r.student_id,
      studentLabel,
      sectionId: r.section_id,
      sectionName,
      trailingAbsences,
      avgScore: avg,
      retentionWhatsappCount: cnt.wa,
      retentionEmailCount: cnt.em,
      guardianPhoneDigits,
      guardianPhoneDisplay,
      guardianLabel,
      guardianEmail,
      mailUserId,
      isSelfContact,
      mailGuardianLabel,
      reasons,
    });
  }

  out.sort((a, b) => a.studentLabel.localeCompare(b.studentLabel, undefined, { sensitivity: "base" }));
  return out;
}

export { digitsOnly };
