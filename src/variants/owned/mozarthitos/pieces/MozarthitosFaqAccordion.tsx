import Image from "next/image";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";
import { MozarthitosFaqQuestion } from "@/variants/owned/mozarthitos/pieces/MozarthitosFaqQuestion";
import { MozarthitosFaqVisitBeacon } from "@/variants/owned/mozarthitos/pieces/MozarthitosFaqVisitBeacon";

interface MozarthitosFaqAccordionProps {
  items: readonly InstituteAnswerItem[];
  questionLevel?: "h2" | "h3";
}

const CHARACTER_SRC = "/images/mozarthitos/inicio/2.png";
const BABY_SRC = "/images/mozarthitos/oferta/1.png";

/** One character stage and a score of questions. The answer stays in the HTML and opens on click. */
export function MozarthitosFaqAccordion({
  items,
  questionLevel = "h2",
}: MozarthitosFaqAccordionProps) {
  return (
    <div className="rounded-[32px] bg-[var(--mz-white)] px-3 py-5 shadow-[0_18px_44px_rgb(0_0_0_/10%)] sm:px-6 sm:py-6">
      <MozarthitosFaqVisitBeacon />
      <div className="grid items-end gap-1 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:items-start md:gap-8">
        <div className="mz-cursos-visual-wrap relative mx-auto h-40 w-full max-w-[260px] md:mx-0 md:h-56 md:max-w-none">
          <span className="mz-blob mz-blob--pink -left-1 top-6 h-16 w-16 md:h-24 md:w-24" aria-hidden />
          <span className="mz-blob mz-blob--blue bottom-1 right-8 h-12 w-12 md:right-1 md:h-16 md:w-16" aria-hidden />
          <Image
            src={CHARACTER_SRC}
            alt=""
            width={220}
            height={180}
            className="relative z-[1] mx-auto h-40 w-auto object-contain md:h-56"
          />
          <Image
            src={BABY_SRC}
            alt=""
            width={96}
            height={96}
            className="absolute bottom-0 right-1 z-[2] h-16 w-16 rounded-full object-cover outline-4 outline-[var(--mz-white)] md:h-[4.5rem] md:w-[4.5rem]"
          />
        </div>
        <div className="min-w-0">
          {items.map((item, index) => (
            <MozarthitosFaqQuestion
              key={item.id}
              item={item}
              index={index}
              questionLevel={questionLevel}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
