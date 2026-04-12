/**
 * Logos under /public/images/sections/certificaciones (U+202F in “a.m.” as in screenshot exports).
 */
const NBS = "\u202f";
const DIR = "/images/sections/certificaciones";

function file(nameSuffix: string): string {
  return encodeURI(
    `${DIR}/Captura de pantalla 2026-04-10 a la(s) ${nameSuffix}${NBS}a.m..png`,
  );
}

/** UTN / English at UTN mark (1.31.36) */
export const CERT_IMG_UTN_INGLES = file("1.31.36");

/** Brand / primary credential (export 1.31.42) */
export const CERT_IMG_GOLDEN = file("1.31.42");

/** Cambridge shield / mark (1.31.48) */
export const CERT_IMG_CAMBRIDGE = file("1.31.48");
