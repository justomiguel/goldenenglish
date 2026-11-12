export const matissLandingEntry = {
  owner: "matiss",
  load: () =>
    import("@/components/organisms/LandingMainSectionsMatiss").then((mod) => mod.LandingMainSectionsMatiss),
};
