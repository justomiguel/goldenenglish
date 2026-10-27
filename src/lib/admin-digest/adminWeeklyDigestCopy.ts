export type DigestLabels = {
  receipts: (count: number) => string;
  messages: (count: number) => string;
  silent: (count: number) => string;
  parentsSubject: (percent: number) => string;
  quiet: string;
  hoy: string;
  cobro: string;
  padres: string;
  weekday: string;
  aula: string;
  entrada: string;
  openReceipts: string;
  openMessages: string;
  openFamilies: string;
  openHome: string;
  paidLine: (percent: number, collected: string, expected: string) => string;
  funnel: (invoices: number, opened: number, checkouts: number, paid: number) => string;
  parentLine: (percent: number) => string;
  attendanceLine: (percent: number) => string;
  tasksLine: (percent: number) => string;
  nothingDue: string;
  noClasses: string;
  intake: (registrations: number, events: number, sessions: number, views: number) => string;
  sessionsWord: (count: number) => string;
  up: (points: number) => string;
  down: (points: number) => string;
  weekdays: [string, string, string, string, string, string, string];
};

const es: DigestLabels = {
  receipts: (count) => `${count} comprobantes sin revisar`,
  messages: (count) => `${count} mensajes sin respuesta`,
  silent: (count) => `${count} familias en silencio`,
  parentsSubject: (percent) => `${percent}% de padres entraron`,
  quiet: "No hay nada en espera.",
  hoy: "Hoy",
  cobro: "Cobro del mes",
  padres: "Padres",
  weekday: "Día pico",
  aula: "Aula",
  entrada: "Entrada",
  openReceipts: "Revisar comprobantes",
  openMessages: "Responder mensajes",
  openFamilies: "Ver familias",
  openHome: "Abrir el panel",
  paidLine: (percent, collected, expected) => `${percent}% cobrado. ${collected} de ${expected}.`,
  funnel: (invoices, opened, checkouts, paid) =>
    `${invoices} facturas del mes. ${opened} abrieron pagos. ${checkouts} iniciaron un pago. ${paid} facturas pagadas.`,
  parentLine: (percent) => `${percent}% de los padres inició sesión.`,
  attendanceLine: (percent) => `${percent}% de las secciones tiene asistencia.`,
  tasksLine: (percent) => `${percent}% de las tareas vencidas sigue abierto.`,
  nothingDue: "No hubo tareas con vencimiento.",
  noClasses: "No hay secciones activas para medir asistencia.",
  intake: (registrations, events, sessions, views) =>
    `${registrations} inscripciones nuevas. ${events} inscripciones a eventos. ${sessions} personas iniciaron sesión. ${views} visitas a blog y eventos.`,
  sessionsWord: (count) => `${count} sesiones`,
  up: (points) => `+${points}`,
  down: (points) => `-${points}`,
  weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

const en: DigestLabels = {
  receipts: (count) => `${count} receipts waiting`,
  messages: (count) => `${count} messages waiting`,
  silent: (count) => `${count} silent families`,
  parentsSubject: (percent) => `${percent}% of parents signed in`,
  quiet: "Nothing is waiting.",
  hoy: "Today",
  cobro: "This month's tuition",
  padres: "Parents",
  weekday: "Peak day",
  aula: "Classroom",
  entrada: "Intake",
  openReceipts: "Review receipts",
  openMessages: "Answer messages",
  openFamilies: "View families",
  openHome: "Open the admin home",
  paidLine: (percent, collected, expected) => `${percent}% collected. ${collected} of ${expected}.`,
  funnel: (invoices, opened, checkouts, paid) =>
    `${invoices} invoices this month. ${opened} opened payments. ${checkouts} started checkout. ${paid} invoices are paid.`,
  parentLine: (percent) => `${percent}% of parents signed in.`,
  attendanceLine: (percent) => `${percent}% of sections have attendance.`,
  tasksLine: (percent) => `${percent}% of due tasks are still open.`,
  nothingDue: "No tasks were due.",
  noClasses: "There are no active sections to measure attendance.",
  intake: (registrations, events, sessions, views) =>
    `${registrations} new registrations. ${events} event enrollments. ${sessions} people signed in. ${views} signed-in blog and event views.`,
  sessionsWord: (count) => `${count} sessions`,
  up: (points) => `+${points}`,
  down: (points) => `-${points}`,
  weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const pt: DigestLabels = {
  ...es,
  receipts: (count) => `${count} comprovantes sem revisão`,
  messages: (count) => `${count} mensagens sem resposta`,
  silent: (count) => `${count} famílias em silêncio`,
  parentsSubject: (percent) => `${percent}% dos pais entraram`,
  quiet: "Não há nada em espera.",
  hoy: "Hoje",
  cobro: "Cobrança do mês",
  padres: "Pais",
  weekday: "Dia de pico",
  aula: "Sala",
  entrada: "Entrada",
  openReceipts: "Revisar comprovantes",
  openMessages: "Responder mensagens",
  openFamilies: "Ver famílias",
  openHome: "Abrir o painel",
  paidLine: (percent, collected, expected) => `${percent}% recebido. ${collected} de ${expected}.`,
  parentLine: (percent) => `${percent}% dos pais iniciou sessão.`,
  attendanceLine: (percent) => `${percent}% das turmas tem presença.`,
  tasksLine: (percent) => `${percent}% das tarefas vencidas segue aberto.`,
  nothingDue: "Não houve tarefas com vencimento.",
  noClasses: "Não há turmas ativas para medir presença.",
  weekdays: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
};

export const DIGEST_LABELS = { es, en, pt } as const;
