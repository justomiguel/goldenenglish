const TOKENS: readonly (readonly [string, string])[] = [
  ["Cuéntanos", "Contanos"],
  ["cuéntanos", "contanos"],
  ["Necesitas", "Necesitás"],
  ["necesitas", "necesitás"],
  ["Imaginas", "Imaginás"],
  ["imaginas", "imaginás"],
  ["Gestionas", "Gestionás"],
  ["gestionas", "gestionás"],
  ["Utilizas", "Utilizás"],
  ["utilizas", "utilizás"],
  ["Empiezas", "Empezás"],
  ["empiezas", "empezás"],
  ["Eliges", "Elegís"],
  ["eliges", "elegís"],
  ["Adaptas", "Adaptás"],
  ["adaptas", "adaptás"],
  ["Conectas", "Conectás"],
  ["conectas", "conectás"],
  ["Puedes", "Podés"],
  ["puedes", "podés"],
  ["Tienes", "Tenés"],
  ["tienes", "tenés"],
  ["Quieres", "Querés"],
  ["quieres", "querés"],
  ["Buscas", "Buscás"],
  ["buscas", "buscás"],
  ["Descubre", "Descubrí"],
  ["descubre", "descubrí"],
  ["Organiza", "Organizá"],
  ["organiza", "organizá"],
  ["Empieza", "Empezá"],
  ["empieza", "empezá"],
  ["Conoce", "Conocé"],
  ["conoce", "conocé"],
  ["Agrega", "Agregá"],
  ["agrega", "agregá"],
  ["Ofrece", "Ofrecé"],
  ["ofrece", "ofrecé"],
  ["Elige", "Elegí"],
  ["elige", "elegí"],
  ["Crea", "Creá"],
  ["crea", "creá"],
];

function escapeToken(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Second person only. A longer word such as "Crear" or "muestra" stays. */
export function toRioplatenseMarketingSentence(input: string): string {
  let next = input;
  for (const [from, to] of TOKENS) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeToken(from)}(?![\\p{L}\\p{N}])`, "gu");
    next = next.replace(pattern, to);
  }
  return next;
}

export function applyRioplatenseMarketingCopy<T>(value: T): T {
  if (typeof value === "string") return toRioplatenseMarketingSentence(value) as T;
  if (Array.isArray(value)) return value.map((item) => applyRioplatenseMarketingCopy(item)) as T;
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      next[key] = applyRioplatenseMarketingCopy(item);
    }
    return next as T;
  }
  return value;
}
