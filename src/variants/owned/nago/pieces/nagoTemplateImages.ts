const BASE = "/images/nago/template";
const CONEXION = "/images/nago/galeria/conexion-internacional-2025";
const CHAMA = "/images/nago/galeria/capoeira-me-chama-2022";

export const NAGO_TEMPLATE = {
  hero: `${CONEXION}/38.jpg`,
  hero2: `${CONEXION}/15.jpg`,
  hero3: `${CONEXION}/01.jpg`,
  hero4: `${CHAMA}/11.jpg`,
  ninos: `${CONEXION}/02.jpg`,
  jovenes: `${CONEXION}/09.jpg`,
  adultos: `${CONEXION}/07.jpg`,
  mayores: `${CONEXION}/40.jpg`,
  expMain: `${CHAMA}/10.jpg`,
  expTl: `${CONEXION}/12.jpg`,
  expTr: `${CHAMA}/19.jpg`,
  expBl: `${CONEXION}/13.jpg`,
  expBr: `${CHAMA}/14.jpg`,
  mestre: `${BASE}/nago-mestre.png`,
  convert: `${CONEXION}/08.jpg`,
  gal01: `${BASE}/nago-gal-01.png`,
  gal02: `${BASE}/nago-gal-02.png`,
  gal03: `${BASE}/nago-gal-03.png`,
  gal04: `${BASE}/nago-gal-04.png`,
  accion01: `${BASE}/nago-accion-01.jpg`,
  accion02: `${BASE}/nago-accion-02.jpg`,
  accion03: `${BASE}/nago-accion-03.jpg`,
  accion04: `${BASE}/nago-accion-04.jpg`,
  evtWinter: `${CONEXION}/24.jpg`,
  evtRoda: `${CHAMA}/05.jpg`,
  evtBrasil: `${CHAMA}/20.jpg`,
} as const;

export const NAGO_HERO_SLIDES: readonly string[] = [
  NAGO_TEMPLATE.hero,
  NAGO_TEMPLATE.hero2,
  NAGO_TEMPLATE.hero3,
  NAGO_TEMPLATE.hero4,
];

export const NAGO_TEMPLATE_GALLERY_URLS: readonly string[] = [
  NAGO_TEMPLATE.gal01,
  NAGO_TEMPLATE.gal02,
  NAGO_TEMPLATE.gal03,
  NAGO_TEMPLATE.gal04,
  NAGO_TEMPLATE.expMain,
  NAGO_TEMPLATE.hero,
  NAGO_TEMPLATE.ninos,
  NAGO_TEMPLATE.jovenes,
  NAGO_TEMPLATE.adultos,
  NAGO_TEMPLATE.mayores,
];
