const BASE = "/images/nago/template";

export const NAGO_TEMPLATE = {
  hero: `${BASE}/nago-hero-roda.png`,
  hero2: `${BASE}/nago-hero-roda-2.png`,
  hero3: `${BASE}/nago-hero-roda-3.png`,
  hero4: `${BASE}/nago-hero-roda-4.png`,
  ninos: `${BASE}/nago-prog-ninos.png`,
  jovenes: `${BASE}/nago-prog-jovenes.png`,
  adultos: `${BASE}/nago-prog-adultos.png`,
  mayores: `${BASE}/nago-prog-mayores.png`,
  expMain: `${BASE}/nago-exp-main.png`,
  expTl: `${BASE}/nago-exp-tl.png`,
  expTr: `${BASE}/nago-exp-tr.png`,
  expBl: `${BASE}/nago-exp-bl.png`,
  expBr: `${BASE}/nago-exp-br.png`,
  mestre: `${BASE}/nago-mestre.png`,
  convert: `${BASE}/nago-convert.png`,
  gal01: `${BASE}/nago-gal-01.png`,
  gal02: `${BASE}/nago-gal-02.png`,
  gal03: `${BASE}/nago-gal-03.png`,
  gal04: `${BASE}/nago-gal-04.png`,
  evtWinter: `${BASE}/nago-evt-winter.png`,
  evtRoda: `${BASE}/nago-evt-roda.png`,
  evtBrasil: `${BASE}/nago-evt-brasil.png`,
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
