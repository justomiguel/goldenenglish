export interface CentrolistoLlmsPage {
  path: string;
  title: string;
}

export interface CentrolistoLlmsLocaleBlock {
  code: string;
  pages: readonly CentrolistoLlmsPage[];
}

export function buildCentrolistoLlmsTxt(input: {
  origin: string;
  name: string;
  tagline: string;
  description: string;
  locales: readonly CentrolistoLlmsLocaleBlock[];
  faqs: readonly { q: string; a: string }[];
}): string {
  const origin = input.origin.replace(/\/$/, "");
  const lines = [
    `# ${input.name}`,
    "",
    `> ${input.tagline}`,
    "",
    input.description,
    "",
    `Contact: ${origin}/es/contacto`,
    "",
    "## Pages",
    "",
  ];

  for (const locale of input.locales) {
    for (const page of locale.pages) {
      lines.push(`- [${page.title}](${origin}/${locale.code}${page.path})`);
    }
    lines.push("");
  }

  if (input.faqs.length > 0) {
    lines.push("## Questions", "");
    for (const faq of input.faqs) {
      lines.push(`### ${faq.q}`, "", faq.a, "");
    }
  }

  return `${lines.join("\n").trim()}\n`;
}
