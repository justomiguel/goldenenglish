import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "event-form-fields",
    date: "2026-07-10",
    area: "events",
    title: t(
      "Editar campos del formulario de un evento",
      "Edit event registration form fields in place",
      "Editar campos do formulário de um evento",
    ),
    summary: t(
      "Los campos extra de inscripción a un evento se editan en el mismo lugar, sin armar el formulario de cero.",
      "Extra event-registration fields can be edited in place, without rebuilding the form.",
      "Os campos extra de inscrição num evento editam-se no mesmo sítio, sem montar o formulário de novo.",
    ),
  },
  {
    id: "mimundo-landing-refresh",
    date: "2026-07-07",
    area: "site",
    title: t(
      "Landing de Mi Mundo renovado",
      "Mi Mundo landing refresh",
      "Landing do Mi Mundo renovado",
    ),
    summary: t(
      "El sitio de Mi Mundo actualizó marca, datos de contacto y logos.",
      "The Mi Mundo site refreshed brand, contact details, and logos.",
      "O site do Mi Mundo atualizou marca, dados de contacto e logótipos.",
    ),
  },
  {
    id: "event-gateway-checkout",
    date: "2026-06-22",
    area: "events",
    title: t(
      "Checkout de eventos con pasarela y transferencia",
      "Event gateway checkout and bank-transfer option",
      "Checkout de eventos com gateway e transferência",
    ),
    summary: t(
      "Los eventos pagos se pueden cobrar por pasarela o transferencia, y el formulario puede pedir fecha de nacimiento.",
      "Paid events can be charged via gateway or bank transfer, and the form can collect date of birth.",
      "Os eventos pagos cobram-se por gateway ou transferência, e o formulário pode pedir a data de nascimento.",
    ),
  },
  {
    id: "pwa-push-collections",
    date: "2026-06-12",
    area: "finance",
    title: t(
      "Notificaciones push y revertir cobranzas",
      "PWA push notifications and collections revert",
      "Notificações push e reverter cobranças",
    ),
    summary: t(
      "La app puede mandar avisos push. En finanzas se puede revertir una cobranza y el portal de pagos quedó más claro.",
      "The app can send push notifications. Finance can revert a collection, and the billing portal is clearer.",
      "A app pode enviar avisos push. Em finanças pode-se reverter uma cobrança e o portal de pagamentos ficou mais claro.",
    ),
  },
  {
    id: "blog-cms-paid-events",
    date: "2026-05-30",
    area: "cms",
    title: t(
      "Blog público e inscripción paga a eventos",
      "Public blog CMS and paid event registration",
      "Blog público e inscrição paga em eventos",
    ),
    summary: t(
      "Admin publica artículos del blog (hero, compartir, idioma). Los eventos pagos se inscriben desde el sitio.",
      "Admins publish blog articles (hero, share, language). Paid events can be registered from the public site.",
      "A admin publica artigos do blog (hero, partilha, idioma). Os eventos pagos inscrevem-se a partir do site.",
    ),
  },
  {
    id: "mercadopago-monthly",
    date: "2026-05-24",
    area: "finance",
    title: t(
      "Checkout mensual con Mercado Pago",
      "Mercado Pago monthly checkout",
      "Checkout mensal com Mercado Pago",
    ),
    summary: t(
      "Las cuotas mensuales se pueden pagar con Mercado Pago, junto con el landing de Mi Mundo.",
      "Monthly tuition can be paid with Mercado Pago, alongside the Mi Mundo landing.",
      "As mensalidades podem pagar-se com Mercado Pago, juntamente com o landing do Mi Mundo.",
    ),
  },
  {
    id: "parent-pwa-portal",
    date: "2026-05-19",
    area: "parent",
    title: t(
      "Portal de familias como app: pagos, asistencia y mensajes",
      "Family portal as an app: payments, attendance, and messages",
      "Portal das famílias como app: pagamentos, assiduidade e mensagens",
    ),
    summary: t(
      "Los tutores instalan el portal en el teléfono: pagan, ven asistencia por sección, mensajes, badges y agenda. Los avisos de deuda se limitan a lo vencido.",
      "Guardians install the portal on their phone: pay, see attendance by section, messages, badges, and the agenda. Payment alerts are overdue-only.",
      "Os encarregados instalam o portal no telemóvel: pagam, veem assiduidade por turma, mensagens, badges e agenda. Os avisos de dívida ficam só no vencido.",
    ),
  },
  {
    id: "espacio-zenit-landing",
    date: "2026-05-19",
    area: "site",
    title: t(
      "Landing de Espacio Zenít con galería real",
      "Espacio Zenít landing with a real photo gallery",
      "Landing do Espacio Zenít com galeria real",
    ),
    summary: t(
      "Espacio Zenít tiene galería, fotos reales y un encabezado/pie más claros.",
      "Espacio Zenít now has a gallery, real photos, and clearer header and footer.",
      "O Espacio Zenít tem galeria, fotos reais e um cabeçalho/rodapé mais claros.",
    ),
  },
  {
    id: "a11y-locales-nago",
    date: "2026-05-15",
    area: "admin",
    title: t(
      "Accesibilidad, idiomas y puesta en marcha de Nago",
      "Accessibility, locales, and Nago site setup",
      "Acessibilidade, idiomas e arranque do Nago",
    ),
    summary: t(
      "Mejoras de accesibilidad e idiomas en todo el producto, más un rediseño de la puesta en marcha y la experiencia Nago.",
      "Accessibility and locale improvements across the product, plus a site-setup overhaul and Nago UX.",
      "Melhorias de acessibilidade e idiomas em todo o produto, mais um redesenho da arranque e da experiência Nago.",
    ),
  },
  {
    id: "portal-messages-contact",
    date: "2026-05-12",
    area: "communications",
    title: t(
      "Contacto público y bandeja de mensajes del portal",
      "Public contact and admin portal-messages inbox",
      "Contacto público e caixa de mensagens do portal",
    ),
    summary: t(
      "El sitio tiene contacto público. Admin lee los mensajes que llegan desde el portal de familias.",
      "The public site has a contact surface. Admins read messages that arrive from the family portal.",
      "O site tem contacto público. A admin lê as mensagens que chegam do portal das famílias.",
    ),
  },
  {
    id: "flow-billing",
    date: "2026-05-11",
    area: "finance",
    title: t(
      "Pasarela Flow, PDF de comprobantes y ficha de pago",
      "Flow gateway, receipt PDFs, and payment detail",
      "Gateway Flow, PDF de comprovativos e ficha de pagamento",
    ),
    summary: t(
      "Los cobros pueden ir por Flow, con PDF de comprobante y una ficha de pago en admin. También se atan tutores a la familia.",
      "Charges can go through Flow, with a receipt PDF and an admin payment-detail view. Tutors can also be linked to the family.",
      "As cobranças podem ir pelo Flow, com PDF de comprovativo e uma ficha de pagamento em admin. Também se ligam tutores à família.",
    ),
  },
  {
    id: "finance-hub",
    date: "2026-05-09",
    area: "finance",
    title: t(
      "Hub de finanzas: cobranza, liquidaciones y moneda",
      "Finance hub: collections, settlements, and currency",
      "Hub de finanças: cobrança, liquidações e moeda",
    ),
    summary: t(
      "Finanzas concentra cobranza por sección, liquidaciones y la moneda del instituto, con una vista de cohorte.",
      "Finance now concentrates section collections, settlements, and institute currency, with a cohort view.",
      "As finanças concentram a cobrança por turma, liquidações e a moeda do instituto, com uma vista de coorte.",
    ),
  },
];
