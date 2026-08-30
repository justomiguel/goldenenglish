import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "nago-nunoa-dark-landing",
    date: "2026-08-29",
    area: "site",
    title: t(
      "Nagô: landing Ñuñoa oscura, horarios y WhatsApp",
      "Nagô: dark Ñuñoa landing, schedule, and WhatsApp",
      "Nagô: landing Ñuñoa escura, horários e WhatsApp",
    ),
    summary: t(
      "La web pública de Capoeira Nagô muestra los horarios de Tegualda, valores por veces por semana y el WhatsApp de reserva. El formulario de inscripción queda en el mismo tema oscuro.",
      "The Capoeira Nagô public site shows the Tegualda schedule, weekly-fee cards, and the booking WhatsApp. Registration uses the same dark theme.",
      "O site público da Capoeira Nagô mostra os horários de Tegualda, valores por vezes por semana e o WhatsApp de reserva. A inscrição fica no mesmo tema escuro.",
    ),
  },
  {
    id: "public-privacy-page",
    date: "2026-08-29",
    area: "registrations",
    title: t(
      "Página de privacidad y consentimiento en la inscripción",
      "Privacy page and consent on registration",
      "Página de privacidade e consentimento na inscrição",
    ),
    summary: t(
      "Hay una página pública de privacidad por instituto y el formulario de preinscripción pide aceptarla. En el detalle de la solicitud el admin ve si la familia aceptó.",
      "Each institute has a public privacy page and the pre-registration form requires acceptance. The admin request detail shows whether the family accepted.",
      "Há uma página pública de privacidade por instituto e o formulário de pré-inscrição pede aceitação. No detalhe do pedido o admin vê se a família aceitou.",
    ),
  },
  {
    id: "directory-quota-enrollment-status",
    date: "2026-08-29",
    area: "admin",
    title: t(
      "Alumnos y padres: al día, matrícula y última inscripción",
      "Students and parents: current fees, enrollment fee, last enrollment",
      "Alunos e pais: em dia, matrícula e última inscrição",
    ),
    summary: t(
      "En Instituto → Alumnos y Padres se ve si están al día con la cuota y si pagaron la matrícula, y se puede ordenar por la última inscripción a una sección.",
      "In Instituto → Students and Parents you can see who is current on monthly fees and who paid the enrollment fee, and sort by the latest section enrollment.",
      "Em Instituto → Alunos e Pais dá para ver quem está em dia com a mensalidade e quem pagou a matrícula, e ordenar pela última inscrição numa turma.",
    ),
  },
  {
    id: "join-payment-disposition",
    date: "2026-08-29",
    area: "registrations",
    title: t(
      "Alta: marcar si entra al día, no al día o con beca",
      "Enroll: mark current, behind, or scholarship",
      "Alta: marcar se entra em dia, em atraso ou com bolsa",
    ),
    summary: t(
      "Al aceptar o asignar sección el admin elige el estado de la cuota. Los meses anteriores del ciclo quedan exentos. El convert de trial cobra matrícula (si hay) más el mes y deja al día.",
      "When accepting or assigning a section the admin sets join-month tuition. Earlier cycle months are exempt. Trial convert charges enrollment (if any) plus this month and marks them current.",
      "Ao aceitar ou atribuir turma o admin define a mensalidade de entrada. Os meses anteriores do ciclo ficam isentos. O convert de trial cobra matrícula (se houver) mais o mês e deixa em dia.",
    ),
  },
  {
    id: "branded-html-email-templates",
    date: "2026-08-29",
    area: "communications",
    title: t(
      "Todos los emails salen con la plantilla HTML del instituto",
      "Every email uses the institute HTML template",
      "Todos os e-mails saem com o modelo HTML do instituto",
    ),
    summary: t(
      "Eventos, reset de contraseña e invitaciones a padres usan el mismo layout con logo y pie. Los mails que escribe un admin también van envueltos.",
      "Events, password reset, and parent invites use the same layout with logo and footer. Staff-composed mail is wrapped too.",
      "Eventos, redefinição de senha e convites a pais usam o mesmo layout com logo e rodapé. Os e-mails que a admin escreve também vão envelopados.",
    ),
  },
  {
    id: "parent-last-access",
    date: "2026-08-29",
    area: "admin",
    title: t(
      "Último acceso real en Padres",
      "Real last access on Parents",
      "Último acesso real em Pais",
    ),
    summary: t(
      "En Instituto → Padres, la columna de último acceso se actualiza cuando un padre entra a la plataforma. Quienes nunca ingresaron siguen en Nunca.",
      "In Instituto → Parents, last access updates when a parent opens the platform. Those who never signed in still show Never.",
      "Em Instituto → Pais, o último acesso atualiza quando um pai entra na plataforma. Quem nunca entrou continua em Nunca.",
    ),
  },
  {
    id: "email-send-webmaster-banner",
    date: "2026-08-29",
    area: "admin",
    title: t(
      "Aviso en admin si falla el envío de email",
      "Admin banner when email sending fails",
      "Aviso em admin se o envio de e-mail falhar",
    ),
    summary: t(
      "Si un correo no sale, admin ve un aviso para contarle al webmaster. Desaparece cuando un envío vuelve a funcionar o lo dan por entendido.",
      "If an email does not go out, admin sees a notice to tell the webmaster. It clears when a send works again or they dismiss it.",
      "Se um e-mail não sai, a admin vê um aviso para contar ao webmaster. Desaparece quando um envio volta a funcionar ou o dão como entendido.",
    ),
  },
  {
    id: "registration-admin-auth-email",
    date: "2026-08-29",
    area: "communications",
    title: t(
      "Avisos de inscripción a los admins",
      "Registration alerts reach admins again",
      "Avisos de inscrição voltam aos admins",
    ),
    summary: t(
      "Los mails de inscripción nueva, recibo y clase de prueba se envían al correo de login de cada admin. Ya no se busca un email en el perfil, que no existe.",
      "New-registration, receipt, and trial emails go to each admin’s login mailbox. The send no longer looks for a profile email column that does not exist.",
      "Os emails de inscrição nova, comprovativo e aula experimental vão para o correio de login de cada admin. Já não se procura um email no perfil, que não existe.",
    ),
  },
  {
    id: "product-changelog-page",
    date: "2026-08-29",
    area: "admin",
    title: t(
      "Página de novedades del sistema",
      "What's-new page in admin",
      "Página de novidades do sistema",
    ),
    summary: t(
      "En Instituto → Datos y ayuda aparece este historial: lo que se fue agregando al producto, extraído de los commits recientes.",
      "Instituto → Data & help now has this history: features added to the product, distilled from recent commits.",
      "Em Instituto → Dados e ajuda aparece este histórico: o que foi sendo adicionado ao produto, extraído dos commits recentes.",
    ),
  },
  {
    id: "trial-classes",
    date: "2026-08-29",
    area: "registrations",
    title: t(
      "Clases de prueba y directorio filtrable",
      "Trial classes and filterable directories",
      "Aulas experimentais e diretório filtrável",
    ),
    summary: t(
      "Las familias pueden pedir una clase de prueba. En admin, los listados de padres y alumnos se filtran más rápido.",
      "Families can request a trial class. Admin parent and student lists now filter faster.",
      "As famílias podem pedir uma aula experimental. Em admin, as listas de encarregados e alunos filtram mais depressa.",
    ),
  },
  {
    id: "enrollment-fee-checkout",
    date: "2026-08-28",
    area: "finance",
    title: t(
      "Checkout de matrícula para secciones llenas",
      "Enrollment-fee checkout for full sections",
      "Checkout de matrícula para turmas cheias",
    ),
    summary: t(
      "Admin puede iniciar el cobro de matrícula aunque la sección ya no tenga cupo, para no perder inscripciones pagas.",
      "Admins can start the enrollment-fee flow even when a section is full, so paid sign-ups are not lost.",
      "A admin pode iniciar a cobrança de matrícula mesmo com a turma cheia, para não perder inscrições pagas.",
    ),
  },
  {
    id: "scholarship-fee-card",
    date: "2026-08-27",
    area: "finance",
    title: t(
      "Cuota mensual con beca ya aplicada",
      "Monthly fee card shows the scholarship average",
      "Mensalidade com bolsa já aplicada",
    ),
    summary: t(
      "La tarjeta de cuota del alumno muestra el promedio ajustado por beca, no solo el arancel de lista.",
      "The student monthly-fee card shows the scholarship-adjusted average, not only the list price.",
      "O cartão de mensalidade do aluno mostra a média ajustada pela bolsa, não só o valor de tabela.",
    ),
  },
];
