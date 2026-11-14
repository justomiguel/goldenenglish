export const mimundoLandingEntry = {
  owner: "mimundo",
  load: () =>
    import("@/variants/owned/mimundo/pieces/LandingMainSectionsMimundo").then((mod) => mod.LandingMainSectionsMimundo),
};
