import type { EmailTemplateDefinition } from "@/types/emailTemplates";

const tableStyle =
  "border-collapse:collapse;width:100%;max-width:480px;font-size:14px;";

export const transferApprovedTemplate: EmailTemplateDefinition = {
  key: "academics.transfer_approved",
  category: "academics",
  label: { es: "Académico: traslado aprobado", en: "Academics: transfer approved" },
  description: {
    es: "Avisa a los tutores que se aprobó un traslado de sección para el alumno.",
    en: "Notifies tutors that a section transfer for the student has been approved.",
  },
  placeholders: [
    { name: "lead", description: "Frase introductoria", sample: "Aprobamos el traslado del alumno." },
    { name: "cohortName", description: "Nombre del cohort", sample: "Cohort 2026" },
    { name: "sectionName", description: "Nombre de la sección", sample: "Section A" },
    { name: "teacherName", description: "Nombre del docente", sample: "Prof. López" },
    { name: "scheduleHtml", description: "HTML con el horario (días + horas)", sample: "<li>Lun 18:00–19:30</li>" },
  ],
  defaults: {
    es: {
      subject: "Traslado de sección aprobado",
      bodyHtml: `<p>{{lead}}</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li><strong>Cohort:</strong> {{cohortName}}</li>
  <li><strong>Sección:</strong> {{sectionName}}</li>
  <li><strong>Docente:</strong> {{teacherName}}</li>
</ul>
<p style="margin:0 0 6px;font-weight:600;">Horario:</p>
<ul style="padding-left:20px;margin:0;">{{scheduleHtml}}</ul>`,
    },
    en: {
      subject: "Section transfer approved",
      bodyHtml: `<p>{{lead}}</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li><strong>Cohort:</strong> {{cohortName}}</li>
  <li><strong>Section:</strong> {{sectionName}}</li>
  <li><strong>Teacher:</strong> {{teacherName}}</li>
</ul>
<p style="margin:0 0 6px;font-weight:600;">Schedule:</p>
<ul style="padding-left:20px;margin:0;">{{scheduleHtml}}</ul>`,
    },
  },
};

export const gradePublishedParentTemplate: EmailTemplateDefinition = {
  key: "academics.grade_published_parent",
  category: "academics",
  label: { es: "Académico: calificación publicada", en: "Academics: grade published" },
  description: {
    es: "Comparte con los tutores la calificación publicada de una evaluación del alumno.",
    en: "Shares the published assessment grade for the student with their tutors.",
  },
  placeholders: [
    { name: "headline", description: "Titular del email", sample: "Nueva calificación publicada" },
    { name: "intro", description: "Frase introductoria", sample: "Compartimos la nota de la evaluación..." },
    { name: "studentLabel", description: "Nombre del alumno", sample: "Juan Pérez" },
    { name: "assessmentName", description: "Nombre de la evaluación", sample: "Parcial 1" },
    { name: "scoreText", description: "Puntaje formateado", sample: "8 / 10" },
    { name: "rubricHtml", description: "Tabla de rúbrica (HTML)", sample: "<tr><td>Listening</td><td>4</td></tr>" },
    { name: "feedbackHtml", description: "Comentario del docente (HTML escapado)", sample: "Buen trabajo." },
    { name: "portalHref", description: "URL al portal del tutor", sample: "https://example.com/es/dashboard/parent" },
    { name: "portalCta", description: "Texto del CTA al portal", sample: "Abrir portal" },
  ],
  defaults: {
    es: {
      subject: "Nueva calificación publicada",
      bodyHtml: `<h1 style="font-size:1.25rem;margin:0 0 12px;">{{headline}}</h1>
<p>{{intro}}</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li><strong>{{studentLabel}}</strong></li>
  <li>{{assessmentName}}</li>
  <li>Puntaje: <strong>{{scoreText}}</strong></li>
</ul>
<table style="${tableStyle}"><tbody>{{rubricHtml}}</tbody></table>
<div style="margin-top:12px;">{{feedbackHtml}}</div>
<p style="margin-top:20px;"><a href="{{portalHref}}" style="color:#103A5C;font-weight:600;">{{portalCta}}</a></p>`,
    },
    en: {
      subject: "New grade published",
      bodyHtml: `<h1 style="font-size:1.25rem;margin:0 0 12px;">{{headline}}</h1>
<p>{{intro}}</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li><strong>{{studentLabel}}</strong></li>
  <li>{{assessmentName}}</li>
  <li>Score: <strong>{{scoreText}}</strong></li>
</ul>
<table style="${tableStyle}"><tbody>{{rubricHtml}}</tbody></table>
<div style="margin-top:12px;">{{feedbackHtml}}</div>
<p style="margin-top:20px;"><a href="{{portalHref}}" style="color:#103A5C;font-weight:600;">{{portalCta}}</a></p>`,
    },
  },
};
