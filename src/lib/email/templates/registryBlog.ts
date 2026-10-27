import type { EmailTemplateDefinition } from "@/types/emailTemplates";
import { withPtFallback } from "@/lib/email/templates/withPtEmailDefaults";

export const blogAdminPendingReviewTemplate: EmailTemplateDefinition = {
  key: "blog.admin_pending_review",
  category: "notifications",
  label: { es: "Blog: artículo por publicar (admin)", en: "Blog: article waiting to publish (admin)" },
  description: {
    es: "Un profesor envió un artículo a revisión.",
    en: "A teacher sent an article for review.",
  },
  placeholders: [
    { name: "articleTitle", description: "Título", sample: "Cómo estudiar verbos" },
    { name: "adminUrl", description: "Link a la revisión", sample: "https://example.com/es/dashboard/admin/cms/blog/review" },
  ],
  defaults: withPtFallback({
    es: {
      subject: "Artículo por publicar · {{articleTitle}}",
      bodyHtml: `<p style="margin:0 0 12px;">Un artículo quedó en revisión: <strong>{{articleTitle}}</strong>.</p>
<p style="margin:0;"><a href="{{adminUrl}}">Abrir la cola de revisión</a></p>`,
    },
    en: {
      subject: "Article to publish · {{articleTitle}}",
      bodyHtml: `<p style="margin:0 0 12px;">An article is waiting for review: <strong>{{articleTitle}}</strong>.</p>
<p style="margin:0;"><a href="{{adminUrl}}">Open the review queue</a></p>`,
    },
  }),
};
