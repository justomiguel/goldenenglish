/**
 * Logos en /public/images/sections/certificaciones (U+202F en “a.m.” como en export de capturas).
 */
const NBS = "\u202f";
const DIR = "/images/sections/certificaciones";

function file(nameSuffix: string): string {
  return encodeURI(
    `${DIR}/Captura de pantalla 2026-04-10 a la(s) ${nameSuffix}${NBS}a.m..png`,
  );
}

/** Logo UTN / Inglés en la UTN (1.31.36) */
export const CERT_IMG_UTN_INGLES = file("1.31.36");

/** Marca / credencial principal (export 1.31.42) */
export const CERT_IMG_GOLDEN = file("1.31.42");

/** Escudo / marca Cambridge (1.31.48) */
export const CERT_IMG_CAMBRIDGE = file("1.31.48");
