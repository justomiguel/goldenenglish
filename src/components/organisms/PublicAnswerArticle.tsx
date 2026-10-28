import type { InstituteAnswerItem } from "@/lib/public/instituteAnswerPages";

interface PublicAnswerArticleProps {
  title: string;
  lead: string;
  items: readonly InstituteAnswerItem[];
}

export function PublicAnswerArticle({ title, lead, items }: PublicAnswerArticleProps) {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1
          id="public-answers-title"
          className="font-display text-3xl font-bold text-[var(--color-heading,var(--color-primary))] md:text-4xl"
        >
          {title}
        </h1>
        <p className="mt-3 text-[var(--color-muted-foreground)] md:text-lg">{lead}</p>
      </header>
      {items.map((item) => (
        <section key={item.id} className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{item.q}</h2>
          <p className="leading-relaxed text-[var(--color-muted-foreground)]">{item.a}</p>
        </section>
      ))}
    </article>
  );
}
