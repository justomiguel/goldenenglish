import { describe, expect, it } from "vitest";
import {
  buildFleetSiteReview,
  chooseAppliedMigration,
  chooseFleetLogo,
  instituteLogoUrl,
  markerVersionForGenericTheme,
  migrationRank,
  migrationReviewState,
  productMigrationHead,
  vercelCustomStatus,
} from "@/lib/pulsar/fleetSiteReview";

describe("fleetSiteReview", () => {
  it("turns a site path into an absolute logo url", () => {
    expect(instituteLogoUrl("/images/nago/logo.png", "https://nago.cl/")).toBe(
      "https://nago.cl/images/nago/logo.png",
    );
    expect(instituteLogoUrl("https://cdn.example/logo.png", "https://nago.cl")).toBe(
      "https://cdn.example/logo.png",
    );
    expect(instituteLogoUrl("", "https://nago.cl")).toBeNull();
  });

  it("uses a local logo file before a remote path that this app does not have", () => {
    expect(
      chooseFleetLogo({
        rawPath: "/images/logo.png",
        origin: "https://nago.cl",
        supabaseUrl: "https://nago.supabase.co",
        localExact: false,
        localFallback: "/images/nago/logo/logo.png",
      }),
    ).toBe("/images/nago/logo/logo.png");
  });

  it("keeps a storage logo when the institute uploaded one", () => {
    expect(
      chooseFleetLogo({
        rawPath: "tenant/logo.png",
        origin: "https://nago.cl",
        supabaseUrl: "https://nago.supabase.co",
        localExact: false,
        localFallback: "/images/nago/logo/logo.png",
      }),
    ).toBe("https://nago.supabase.co/storage/v1/object/public/landing-media/tenant/logo.png");
  });

  it("picks the newest product file and skips brand seeds", () => {
    expect(
      productMigrationHead([
        "108_site_theme_nago_seed.sql",
        "232_generic_institute_theme_kinds.sql",
        "233_generic_institute_theme_seeds.sql",
        "notes.txt",
      ]),
    ).toBe("233_generic_institute_theme_seeds.sql");
  });

  it("marks a database behind when the ledger is older than the repo", () => {
    expect(migrationReviewState("232_generic_institute_theme_kinds.sql", "233_generic_institute_theme_seeds.sql")).toBe(
      "behind",
    );
    expect(migrationReviewState("233_generic_institute_theme_seeds.sql", "233_generic_institute_theme_seeds.sql")).toBe(
      "current",
    );
    expect(migrationReviewState(null, "233_generic_institute_theme_seeds.sql")).toBe("unknown");
  });

  it("keeps the newer of the ledger and the generic theme marker", () => {
    expect(
      chooseAppliedMigration(["232_generic_institute_theme_kinds.sql"], "233_generic_institute_theme_seeds.sql"),
    ).toBe("233_generic_institute_theme_seeds.sql");
  });

  it("builds owner, dns, and vercel facts for one site", () => {
    const review = buildFleetSiteReview({
      dataMode: "shared_schema",
      postgresSchema: "tenant_club",
      hosts: ["club.centrolisto.cl", "club.example.com"],
      slug: "club",
      platformHosts: ["centrolisto.cl"],
      migrationHead: "233_generic_institute_theme_seeds.sql",
      ledgerVersions: ["232_generic_institute_theme_kinds.sql"],
      markerVersion: null,
      vercelNames: ["club.example.com"],
      vercelConfigured: true,
      ownerEmail: "owner@example.com",
      ownerUsed: 2,
    });
    expect(review.dataMode).toBe("shared_schema");
    expect(review.schemaName).toBe("tenant_club");
    expect(review.migrationState).toBe("behind");
    expect(review.ownerEmail).toBe("owner@example.com");
    expect(review.ownerUsed).toBe(2);
    const custom = review.hosts.find((host) => host.role === "custom");
    expect(custom).toMatchObject({
      host: "club.example.com",
      dnsKind: "cname",
      dnsName: "club",
      dnsTarget: "cname.vercel-dns.com",
      vercel: "attached",
    });
    expect(vercelCustomStatus({ customHost: "missing.example.com", tokenConfigured: true, names: [] })).toBe(
      "missing",
    );
    expect(vercelCustomStatus({ customHost: "club.example.com", tokenConfigured: false, names: null })).toBe(
      "skipped",
    );
  });

  it("covers logo, migration, and vercel branches the fleet table uses", () => {
    expect(migrationRank("notes.txt")).toBe(0);
    expect(productMigrationHead(["notes.txt"])).toBe("");
    expect(markerVersionForGenericTheme(["233_generic_institute_theme_seeds.sql"], false)).toBeNull();
    expect(markerVersionForGenericTheme(["232_generic_institute_theme_kinds.sql"], true)).toBeNull();
    expect(markerVersionForGenericTheme(["233_generic_institute_theme_seeds.sql"], true)).toBe(
      "233_generic_institute_theme_seeds.sql",
    );
    expect(
      chooseFleetLogo({
        rawPath: "http://cdn.example/logo.png",
        origin: "https://nago.cl",
        supabaseUrl: "https://nago.supabase.co",
        localExact: false,
        localFallback: null,
      }),
    ).toBe("http://cdn.example/logo.png");
    expect(
      chooseFleetLogo({
        rawPath: "/images/nago/logo/logo.png",
        origin: "https://nago.cl",
        supabaseUrl: "https://nago.supabase.co",
        localExact: true,
        localFallback: null,
      }),
    ).toBe("/images/nago/logo/logo.png");
    expect(
      chooseFleetLogo({
        rawPath: "tenant/logo.png",
        origin: "https://nago.cl",
        supabaseUrl: " ",
        localExact: false,
        localFallback: "/images/nago/logo/logo.png",
      }),
    ).toBe("/images/nago/logo/logo.png");
    expect(
      chooseFleetLogo({
        rawPath: "/images/missing.png",
        origin: "https://nago.cl",
        supabaseUrl: "",
        localExact: false,
        localFallback: null,
      }),
    ).toBe("https://nago.cl/images/missing.png");
    expect(
      chooseFleetLogo({
        rawPath: "",
        origin: "",
        supabaseUrl: "",
        localExact: false,
        localFallback: null,
      }),
    ).toBeNull();
    expect(vercelCustomStatus({ customHost: "", tokenConfigured: true, names: [] })).toBe("none");
    expect(vercelCustomStatus({ customHost: "club.example.com", tokenConfigured: true, names: null })).toBe(
      "failed",
    );

    const review = buildFleetSiteReview({
      dataMode: "project",
      postgresSchema: " ",
      hosts: ["localhost", "club.example.com"],
      slug: "club",
      platformHosts: ["centrolisto.cl"],
      migrationHead: "233_generic_institute_theme_seeds.sql",
      ledgerVersions: [],
      markerVersion: null,
      vercelNames: null,
      vercelConfigured: true,
      ownerEmail: null,
      ownerUsed: 1,
    });
    expect(review.dataMode).toBe("project");
    expect(review.schemaName).toBe("public");
    expect(review.ownerUsed).toBeNull();
    expect(review.hosts.find((host) => host.host === "localhost")).toMatchObject({
      dnsKind: null,
      dnsName: "",
      dnsTarget: "",
    });
  });
});
