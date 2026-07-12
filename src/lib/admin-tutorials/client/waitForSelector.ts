/** Poll until `document.querySelector(selector)` finds an element or timeout. */
export async function waitForSelector(
  selector: string,
  options?: { timeoutMs?: number; intervalMs?: number },
): Promise<Element | null> {
  const timeoutMs = options?.timeoutMs ?? 8000;
  const intervalMs = options?.intervalMs ?? 50;
  const start = Date.now();
  for (;;) {
    const el = typeof document !== "undefined" ? document.querySelector(selector) : null;
    if (el) return el;
    if (Date.now() - start >= timeoutMs) return null;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
