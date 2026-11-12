export const espaciozenitLandingEntry = {
  owner: "espaciozenit",
  load: () =>
    import("@/components/organisms/LandingMainSectionsEspacioZenit").then(
      (mod) => mod.LandingMainSectionsEspacioZenit,
    ),
};
