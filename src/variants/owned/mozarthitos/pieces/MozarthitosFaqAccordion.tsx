import { ChevronDown } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";

interface MozarthitosFaqAccordionProps {
  items: readonly InstituteAnswerItem[];
  questionLevel?: "h2" | "h3";
}

const URL_PATTERN = /(https:\/\/[^\s]+)/g;
const CHARACTER_SRC = "/images/mozarthitos/inicio/2.png";
const BABY_SRC = "/images/mozarthitos/oferta/1.png";

const OPEN_WASH = [
  "open:bg-[color-mix(in_srgb,var(--mz-pink)_10%,white)]",
  "open:bg-[color-mix(in_srgb,var(--mz-blue)_12%,white)]",
  "open:bg-[color-mix(in_srgb,var(--mz-yellow)_34%,white)]",
] as const;

function answerNodes(paragraph: string): ReactNode[] {
  return paragraph.split(URL_PATTERN).map((part, index) => {
    if (!part.startsWith("https://")) return part;
    return (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[var(--mz-header-red-deep)] underline underline-offset-4"
      >
        {part}
      </a>
    );
  });
}

/** One character stage and a score of questions. The answer stays in the HTML and opens on click. */
export function MozarthitosFaqAccordion({
  items,
  questionLevel = "h2",
}: MozarthitosFaqAccordionProps) {
  const QuestionTag = questionLevel === "h3" ? "h3" : "h2";
  return (
    <div className="rounded-[32px] bg-[var(--mz-white)] px-3 py-5 shadow-[0_18px_44px_rgb(0_0_0_/10%)] sm:px-6 sm:py-6">
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
            <details
              key={item.id}
              className={`group border-b border-[color-mix(in_srgb,var(--mz-header-red-deep)_16%,transparent)] px-2 last:border-b-0 ${OPEN_WASH[index % OPEN_WASH.length]}`}
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 py-3 text-left [&::-webkit-details-marker]:hidden">
                <span
                  className="w-7 shrink-0 text-sm font-bold tabular-nums text-[var(--mz-header-red-deep)]"
                  aria-hidden
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <QuestionTag className="min-w-0 flex-1 text-base font-semibold leading-snug text-[var(--mz-header-red-deep)] md:text-lg">
                  {item.q}
                </QuestionTag>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-[var(--mz-pink)] transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden
                />
              </summary>
              <div className="max-w-[68ch] space-y-3 pb-4 pl-10 text-base leading-relaxed text-[var(--color-foreground)]">
                {item.a.split(/\n\n+/u).map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="whitespace-pre-line">
                    {answerNodes(paragraph)}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
