import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "email-template-media",
    date: "2026-10-14",
    area: "communications",
    title: t(
      "Imagen y enlace de video en los correos",
      "Image and video link in emails",
      "Imagem e link de vídeo nos e-mails",
    ),
    summary: t(
      "El editor de correos inserta una imagen o un enlace de YouTube o Vimeo. El video no se reproduce dentro del mensaje.",
      "The email editor inserts an image or a YouTube or Vimeo link. The video does not play inside the message.",
      "O editor de e-mails insere uma imagem ou um link do YouTube ou do Vimeo. O vídeo não toca dentro da mensagem.",
    ),
  },
  {
    id: "event-email-templates",
    date: "2026-10-13",
    area: "events",
    title: t(
      "Correos del evento editables",
      "Editable event emails",
      "E-mails do evento editáveis",
    ),
    summary: t(
      "En Notificaciones se editan los correos de inscripción, pago y recordatorio. La inscripción recibida y el pago aprobado pueden tener un texto distinto por flujo.",
      "Notifications now edits registration, payment, and reminder emails. Registration received and payment approved can use different copy per flow.",
      "Em Notificações dá para editar os e-mails de inscrição, pagamento e lembrete. A inscrição recebida e o pagamento aprovado podem ter um texto diferente por fluxo.",
    ),
  },
  {
    id: "inscrito-neutral-spanish",
    date: "2026-10-13",
    area: "portal",
    title: t(
      "Inscrito, en lugar de inscripto",
      "Inscrito instead of inscripto",
      "Inscrito, em vez de inscripto",
    ),
    summary: t(
      "Las pantallas dicen inscrito e inscrita, la forma neutra en español.",
      "Screens now say inscrito and inscrita, the neutral Spanish form.",
      "As telas passaram a dizer inscrito e inscrita, a forma neutra em espanhol.",
    ),
  },
  {
    id: "neutral-spanish-copy",
    date: "2026-10-13",
    area: "portal",
    title: t(
      "Español neutro en la plataforma",
      "Neutral Spanish across the platform",
      "Espanhol neutro na plataforma",
    ),
    summary: t(
      "Los textos en español usan tuteo neutro, para que se entiendan igual en cualquier país.",
      "Spanish copy now uses neutral tú, so it reads the same in every country.",
      "Os textos em espanhol ficaram neutros, para se entenderem igual em qualquer país.",
    ),
  },
];
