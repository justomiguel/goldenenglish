export function postFaqMetric(input: {
  kind: "visit" | "open";
  questionId: string | null;
}): void {
  void fetch("/api/faq/metrics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    keepalive: true,
  }).catch(() => undefined);
}
