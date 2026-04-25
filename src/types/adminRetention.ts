export type LoadAdminRetentionOptions = {
  cohortId?: string;
  /** Carga una sola matrícula (p. ej. notificación de contacto). */
  enrollmentId?: string;
  page?: number;
  pageSize?: number;
};

export type LoadAdminRetentionResult = {
  rows: AdminRetentionCandidate[];
  total: number;
};

export type AdminRetentionCandidate = {
  enrollmentId: string;
  studentId: string;
  studentLabel: string;
  sectionId: string;
  sectionName: string;
  trailingAbsences: number;
  avgScore: number | null;
  /** Veces que se registró apertura de seguimiento por WhatsApp (admin). */
  retentionWhatsappCount: number;
  /** Veces que se envió el correo de retención brindado. */
  retentionEmailCount: number;
  guardianPhoneDigits: string | null;
  /** Teléfono del destinatario (tutor o alumno) para tooltip; si falta texto, se derivan de los dígitos. */
  guardianPhoneDisplay: string | null;
  /** Nombre mostrable del contacto telefónico (tutor o alumno en modo propio). */
  guardianLabel: string | null;
  /** Email de login del destinatario (tutor o alumno en contacto propio). */
  guardianEmail: string | null;
  /** Usuario auth destinatario del mail (tutor o el mismo `studentId` si es contacto propio). */
  mailUserId: string | null;
  /** Sin tutores, alumno no menor: notificación al propio alumno (tel. y mail del perfil / auth). */
  isSelfContact: boolean;
  /** Nombre mostrable del destinatario del mail (tutor o alumno). */
  mailGuardianLabel: string | null;
  reasons: ("absences" | "low_average")[];
};
