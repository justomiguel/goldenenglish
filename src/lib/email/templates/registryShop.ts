import type { EmailTemplateDefinition, EmailTemplatePlaceholder } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

const linkStyle =
  "display:inline-block;background:#103A5C;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;";

const passwordPlaceholder: EmailTemplatePlaceholder = {
  name: "password",
  description: "Contraseña temporal del comprador invitado",
  sample: "tmp-x7k2",
};
const signInUrlPlaceholder: EmailTemplatePlaceholder = {
  name: "signInUrl",
  description: "URL de inicio de sesión",
  sample: "https://example.com/es/login",
};
const orderUrlPlaceholder: EmailTemplatePlaceholder = {
  name: "orderUrl",
  description: "URL del pedido con token",
  sample: "https://example.com/es/tienda/pedido/pedido/tok",
};
const pickupNotePlaceholder: EmailTemplatePlaceholder = {
  name: "pickupNote",
  description: "Nota de retiro en el instituto",
  sample: "Retiro en el instituto en horario de atención.",
};

export const SHOP_EMAIL_KEYS = [
  "shop.guest_account_created",
  "shop.order_started",
  "shop.order_paid",
  "shop.order_ready",
] as const;

export type ShopEmailKey = (typeof SHOP_EMAIL_KEYS)[number];

export const shopGuestAccountCreatedTemplate: EmailTemplateDefinition = {
  key: "shop.guest_account_created",
  category: "notifications",
  label: { es: "Tienda: cuenta de invitado", en: "Shop: guest account created" },
  description: {
    es: "Envía la contraseña temporal y el enlace del pedido cuando un visitante crea cuenta al pagar.",
    en: "Sends the temporary password and order link when a visitor creates an account at checkout.",
  },
  placeholders: [passwordPlaceholder, signInUrlPlaceholder, orderUrlPlaceholder],
  defaults: withPtFallback({
    es: {
      subject: "Tu cuenta y pedido de la tienda",
      bodyHtml: `<p>Hola,</p>
<p>Creamos tu cuenta de tutor para seguir el pedido. Tu contraseña temporal es:</p>
<p><strong>{{password}}</strong></p>
<p style="margin:24px 0;"><a href="{{signInUrl}}" style="${linkStyle}">Ingresar</a></p>
<p>Puedes ver el estado del pedido aquí:</p>
<p><a href="{{orderUrl}}">{{orderUrl}}</a></p>
<p style="font-size:0.875rem;color:#6B7280;">Te vamos a pedir que cambies la contraseña la primera vez que ingreses.</p>`,
    },
    en: {
      subject: "Your shop account and order",
      bodyHtml: `<p>Hi,</p>
<p>We created a parent account so you can follow this order. Your temporary password is:</p>
<p><strong>{{password}}</strong></p>
<p style="margin:24px 0;"><a href="{{signInUrl}}" style="${linkStyle}">Sign in</a></p>
<p>You can check the order status here:</p>
<p><a href="{{orderUrl}}">{{orderUrl}}</a></p>
<p style="font-size:0.875rem;color:#6B7280;">You will be asked to change this password the first time you sign in.</p>`,
    },
  }),
};

export const shopOrderStartedTemplate: EmailTemplateDefinition = {
  key: "shop.order_started",
  category: "notifications",
  label: { es: "Tienda: pedido iniciado", en: "Shop: order started" },
  description: {
    es: "Avisa a un tutor existente que se inició un pedido con su email, sin cambiar la contraseña.",
    en: "Tells an existing parent that an order was started with their email. Does not change the password.",
  },
  placeholders: [orderUrlPlaceholder],
  defaults: withPtFallback({
    es: {
      subject: "Iniciamos tu pedido de la tienda",
      bodyHtml: `<p>Hola,</p>
<p>Registramos un pedido a tu nombre. Todavía está pendiente de pago.</p>
<p style="margin:24px 0;"><a href="{{orderUrl}}" style="${linkStyle}">Ver pedido</a></p>`,
    },
    en: {
      subject: "We started your shop order",
      bodyHtml: `<p>Hi,</p>
<p>We registered an order under your email. Payment is still pending.</p>
<p style="margin:24px 0;"><a href="{{orderUrl}}" style="${linkStyle}">View order</a></p>`,
    },
  }),
};

export const shopOrderPaidTemplate: EmailTemplateDefinition = {
  key: "shop.order_paid",
  category: "notifications",
  label: { es: "Tienda: pedido pagado", en: "Shop: order paid" },
  description: {
    es: "Confirma el pago y recuerda que el retiro es en el instituto.",
    en: "Confirms payment and reminds the buyer that pickup is at the institute.",
  },
  placeholders: [orderUrlPlaceholder, pickupNotePlaceholder],
  defaults: withPtFallback({
    es: {
      subject: "Recibimos el pago de tu pedido",
      bodyHtml: `<p>Hola,</p>
<p>El pago de tu pedido de la tienda fue confirmado.</p>
<p>{{pickupNote}}</p>
<p style="margin:24px 0;"><a href="{{orderUrl}}" style="${linkStyle}">Ver pedido</a></p>`,
    },
    en: {
      subject: "We received your shop payment",
      bodyHtml: `<p>Hi,</p>
<p>Payment for your shop order was confirmed.</p>
<p>{{pickupNote}}</p>
<p style="margin:24px 0;"><a href="{{orderUrl}}" style="${linkStyle}">View order</a></p>`,
    },
  }),
};

export const shopOrderReadyTemplate: EmailTemplateDefinition = {
  key: "shop.order_ready",
  category: "notifications",
  label: { es: "Tienda: listo para retirar", en: "Shop: ready for pickup" },
  description: {
    es: "Avisa al comprador que el pedido ya se puede retirar en el instituto.",
    en: "Tells the buyer the order is ready to pick up at the institute.",
  },
  placeholders: [orderUrlPlaceholder, pickupNotePlaceholder],
  defaults: withPtFallback({
    es: {
      subject: "Tu pedido está listo para retirar",
      bodyHtml: `<p>Hola,</p>
<p>Tu pedido de la tienda ya está listo para retirar.</p>
<p>{{pickupNote}}</p>
<p style="margin:24px 0;"><a href="{{orderUrl}}" style="${linkStyle}">Ver pedido</a></p>`,
    },
    en: {
      subject: "Your order is ready for pickup",
      bodyHtml: `<p>Hi,</p>
<p>Your shop order is ready to pick up.</p>
<p>{{pickupNote}}</p>
<p style="margin:24px 0;"><a href="{{orderUrl}}" style="${linkStyle}">View order</a></p>`,
    },
  }),
};

export const SHOP_EMAIL_TEMPLATES: ReadonlyArray<EmailTemplateDefinition> = [
  shopGuestAccountCreatedTemplate,
  shopOrderStartedTemplate,
  shopOrderPaidTemplate,
  shopOrderReadyTemplate,
];
