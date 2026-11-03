interface TaskAnswerReadProps {
  answerLabel: string;
  reviewTitle: string;
  olderLabel: string;
  answer: string | null;
  reviews: readonly { id: string; body: string }[];
}

export function TaskAnswerRead({ answerLabel, reviewTitle, olderLabel, answer, reviews }: TaskAnswerReadProps) {
  const [latest, ...older] = reviews;
  if (!answer && !latest) return null;
  return (
    <section className="space-y-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      {answer ? (
        <p className="text-sm text-[var(--color-foreground)]">
          <span className="font-semibold">{answerLabel}</span> {answer}
        </p>
      ) : null}
      {latest ? (
        <p className="text-sm text-[var(--color-foreground)]">
          <span className="font-semibold">{reviewTitle}</span> {latest.body}
        </p>
      ) : null}
      {older.length > 0 ? (
        <details>
          <summary className="cursor-pointer text-sm font-semibold text-[var(--color-primary)]">{olderLabel}</summary>
          <ul className="mt-2 space-y-2">
            {older.map((review) => (
              <li key={review.id} className="text-sm text-[var(--color-foreground)]">{review.body}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
