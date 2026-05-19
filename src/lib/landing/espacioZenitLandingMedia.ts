const BASE = "/images/espaciozenit";

function publicUrl(folder: string, filename: string): string {
  return encodeURI(`${BASE}/${folder}/${filename}`);
}

export const EZ_DISCIPLINE_HIPHOP_SRC = publicUrl("disciplinas", "hiphop.jpeg");
export const EZ_DISCIPLINE_BALLET_SRC = publicUrl("disciplinas", "ballet.jpeg");
export const EZ_OFERTA_ENROLLMENT_SRC = publicUrl("oferta", "1.jpeg");

export const EZ_HORARIOS_URLS: readonly string[] = (
  ["1.jpeg", "2.jpeg", "3.jpeg"] as const
).map((name) => publicUrl("horarios", name));
