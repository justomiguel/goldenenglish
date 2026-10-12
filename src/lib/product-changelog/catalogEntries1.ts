import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "event-registration-form-preview",
    date: "2026-10-12",
    area: "events",
    title: t(
      "Vista previa del formulario de un evento",
      "Preview an event registration form",
      "Pré-visualizar o formulário de um evento",
    ),
    summary: t(
      "Desde el formulario del evento se puede ver cómo queda la inscripción, aunque el evento siga en borrador. Esa vista no inscribe a nadie.",
      "The event form can show the registration page while the event is still a draft. That view does not register anyone.",
      "No formulário do evento dá para ver a inscrição, mesmo com o evento ainda em rascunho. Essa vista não inscreve ninguém.",
    ),
  },
  {
    id: "event-registration-flows",
    date: "2026-10-12",
    area: "events",
    title: t(
      "Flujos de inscripción en eventos",
      "Event registration flows",
      "Fluxos de inscrição em eventos",
    ),
    summary: t(
      "Un evento puede tener uno o más caminos de inscripción, con preguntas propias. El precio puede seguir siendo por residencia o depender del flujo, nunca los dos.",
      "An event can have one or more registration paths, each with its own questions. Price stays by residency or follows the path, never both.",
      "Um evento pode ter um ou mais caminhos de inscrição, com perguntas próprias. O preço continua por residência ou depende do fluxo, nunca os dois.",
    ),
  },
  {
    id: "event-registration-field-order",
    date: "2026-10-12",
    area: "events",
    title: t(
      "Orden y obligatoriedad en la inscripción a eventos",
      "Event registration field order and required flags",
      "Ordem e obrigatoriedade na inscrição de eventos",
    ),
    summary: t(
      "En el formulario de un evento se puede arrastrar el orden de las preguntas y marcar teléfono o fecha de nacimiento como obligatorios.",
      "An event form can drag question order and mark phone or birth date as required.",
      "No formulário de um evento dá para arrastar a ordem das perguntas e marcar telefone ou data de nascimento como obrigatórios.",
    ),
  },
  {
    id: "home-event-popup",
    date: "2026-10-10",
    area: "events",
    title: t(
      "Aviso de eventos en el inicio",
      "Event notice on the home page",
      "Aviso de eventos na página inicial",
    ),
    summary: t(
      "Un evento publicado puede mostrarse al entrar al sitio. Si hay varios, el aviso los recorre y se puede cerrar.",
      "A published event can appear when someone opens the site. Several events share one notice you can close.",
      "Um evento publicado pode aparecer ao abrir o site. Se houver vários, o aviso percorre-os e pode ser fechado.",
    ),
  },
  {
    id: "merch-checkout-guest-parent",
    date: "2026-09-04",
    area: "site",
    title: t(
      "Checkout de merchandising y cuenta de apoderado invitada",
      "Merch checkout and guest parent account",
      "Checkout de merchandising e conta de encarregado convidado",
    ),
    summary: t(
      "Las familias pagan uniformes y kits con Flow o Mercado Pago. Un correo nuevo crea un apoderado; un estudiante no puede pagar.",
      "Families pay for uniforms and kits with Flow or Mercado Pago. A new email becomes a parent; a student cannot pay.",
      "As famílias pagam uniformes e kits com Flow ou Mercado Pago. Um e-mail novo cria um encarregado; um estudante não pode pagar.",
    ),
  },
  {
    id: "public-merch-shop",
    date: "2026-09-04",
    area: "site",
    title: t(
      "Tienda pública de merchandising y estado del pedido",
      "Public merch shop and order status",
      "Loja pública de merchandising e estado do pedido",
    ),
    summary: t(
      "Cuando merch está activo, las familias ven el catálogo en /tienda y el estado de retiro con el token del pedido.",
      "When merch is on, families can browse /tienda and check pickup status with the order token.",
      "Quando merch está ativo, as famílias veem o catálogo em /tienda e o estado de levantamento com o token do pedido.",
    ),
  },
  {
    id: "admin-merch-catalog",
    date: "2026-09-04",
    area: "admin",
    title: t(
      "Catálogo de merchandising: productos, variantes y fotos",
      "Merch catalog: products, variants, and photos",
      "Catálogo de merchandising: produtos, variantes e fotos",
    ),
    summary: t(
      "En Merchandising el equipo carga SKUs con talla, color, precio y stock. El producto nace como borrador y pide al menos una variante para activarse.",
      "In Merchandising, staff can publish SKUs with size, color, price, and stock. Products start as drafts and need at least one variant before they go live.",
      "Em Merchandising a equipa carrega SKUs com tamanho, cor, preço e stock. O produto nasce como rascunho e precisa de pelo menos uma variante para ativar.",
    ),
  },
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
    id: "directory-monthly-status-column-filter",
    date: "2026-08-31",
    area: "admin",
    title: t(
      "Alumnos y padres: columna Al día y filtro",
      "Students and parents: Current column and filter",
      "Alunos e pais: coluna Em dia e filtro",
    ),
    summary: t(
      "Al día quedó en su propia columna (aparte del monto mensual). En Filtros se puede listar quién está al día, quién no, o quién no tiene cuota.",
      "Current-on-fees is its own column, separate from the monthly amount. Filters can list who is current, behind, or has no monthly fee.",
      "Em dia ficou numa coluna própria, aparte do valor mensal. Nos filtros dá para listar quem está em dia, em atraso ou sem mensalidade.",
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
];
