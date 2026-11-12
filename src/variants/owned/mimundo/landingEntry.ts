export const mimundoLandingEntry = {
  owner: "mimundo",
  load: () =>
    import("@/components/organisms/LandingMainSectionsMimundo").then((mod) => mod.LandingMainSectionsMimundo),
};
