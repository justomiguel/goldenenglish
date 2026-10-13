import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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
