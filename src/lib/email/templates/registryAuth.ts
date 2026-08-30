import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

const linkStyle =
  "display:inline-block;background:#103A5C;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;";

export const passwordResetTemplate: EmailTemplateDefinition = {
  key: "notifications.password_reset",
  category: "notifications",
  label: { es: "Cuenta: restablecer contraseña", en: "Account: reset password" },
  description: {
    es: "Link de recuperación cuando alguien pide restablecer su contraseña.",
    en: "Recovery link when someone asks to reset their password.",
  },
  placeholders: [
    { name: "brandName", description: "Nombre del instituto", sample: "Instituto" },
    { name: "email", description: "Email de la cuenta", sample: "ana@example.com" },
    { name: "href", description: "Link de recuperación", sample: "https://example.com/reset" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "{{brandName}} — Restablecé tu contraseña",
      bodyHtml: `<p>Hola,</p>
<p>Recibimos un pedido para restablecer la contraseña de tu cuenta ({{email}}). Hacé clic en el botón para definir una nueva contraseña. El enlace dura 1 hora.</p>
<p style="margin:24px 0;"><a href="{{href}}" style="${linkStyle}">Restablecer contraseña</a></p>
<p style="font-size:0.875rem;color:#6B7280;">Si el botón no funciona, pegá este enlace en tu navegador:<br/><a href="{{href}}">{{href}}</a></p>
<p style="font-size:0.875rem;color:#6B7280;">Si no pediste este correo, podés ignorarlo. Tu contraseña no cambiará.</p>`,
    },
    en: {
      subject: "{{brandName}} — Reset your password",
      bodyHtml: `<p>Hi,</p>
<p>We received a request to reset the password for your account ({{email}}). Click the button to set a new password. The link expires in 1 hour.</p>
<p style="margin:24px 0;"><a href="{{href}}" style="${linkStyle}">Reset password</a></p>
<p style="font-size:0.875rem;color:#6B7280;">If the button does not work, paste this link in your browser:<br/><a href="{{href}}">{{href}}</a></p>
<p style="font-size:0.875rem;color:#6B7280;">If you did not request this email, you can ignore it. Your password will not change.</p>`,
    },
  }),
};

export const adminPasswordResetNoticeTemplate: EmailTemplateDefinition = {
  key: "notifications.admin_password_reset",
  category: "notifications",
  label: {
    es: "Cuenta: aviso de reset por admin",
    en: "Account: admin reset notice",
  },
  description: {
    es: "Aviso de seguridad cuando un admin restablece la contraseña por DNI.",
    en: "Security notice when staff resets a password by DNI.",
  },
  placeholders: [
    { name: "brandName", description: "Nombre del instituto", sample: "Instituto" },
    { name: "email", description: "Email de la cuenta", sample: "ana@example.com" },
    { name: "contactEmail", description: "Email de contacto", sample: "hola@example.com" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "{{brandName}} — Un administrador restableció tu contraseña",
      bodyHtml: `<p>Hola,</p>
<p>Un administrador acaba de restablecer la contraseña de tu cuenta ({{email}}). La próxima vez que ingreses te vamos a pedir que elijas una contraseña nueva.</p>
<p>Si no pediste este cambio ni lo coordinaste con nuestro equipo, escribinos enseguida a <a href="mailto:{{contactEmail}}">{{contactEmail}}</a> para asegurar tu cuenta.</p>
<p style="font-size:0.875rem;color:#6B7280;">Este es un aviso de seguridad automático. Podés ignorarlo si vos coordinaste el reset con nosotros.</p>`,
    },
    en: {
      subject: "{{brandName}} — An administrator reset your password",
      bodyHtml: `<p>Hi,</p>
<p>An administrator just reset the password for your account ({{email}}). The next time you sign in we will ask you to choose a new password.</p>
<p>If you did not request this change and did not arrange it with our team, write to us immediately at <a href="mailto:{{contactEmail}}">{{contactEmail}}</a> to secure your account.</p>
<p style="font-size:0.875rem;color:#6B7280;">This is an automatic security notice. You can ignore it if you arranged the reset with us.</p>`,
    },
  }),
};
