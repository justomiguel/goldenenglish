export const lioraLandingEntry = {
  owner: "liora",
  load: () =>
    import("@/components/organisms/LandingMainSectionsLiora").then((mod) => mod.LandingMainSectionsLiora),
};
