export const mozarthitosLandingEntry = {
  owner: "mozarthitos",
  load: () =>
    import("@/components/organisms/LandingMainSectionsMozarthitos").then((mod) => mod.LandingMainSectionsMozarthitos),
};
