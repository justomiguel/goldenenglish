import { useEffect } from "react";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TenantPublicEnvBootstrap } from "@/components/molecules/TenantPublicEnvBootstrap";
import type { TenantPublicEnv } from "@/lib/tenant/tenantRegistry";

type WindowWithTenantPublic = Window & { __GE_TENANT_PUBLIC__?: TenantPublicEnv };

const value: TenantPublicEnv = {
  url: "https://example.supabase.co",
  anonKey: "anon-public",
  origin: "http://localhost:3000",
};

describe("TenantPublicEnvBootstrap", () => {
  afterEach(() => {
    delete (window as WindowWithTenantPublic).__GE_TENANT_PUBLIC__;
  });

  it("assigns the public bag during render, before child effects", () => {
    const seen: string[] = [];
    function Child() {
      useEffect(() => {
        seen.push((window as WindowWithTenantPublic).__GE_TENANT_PUBLIC__?.url ?? "");
      }, []);
      return null;
    }

    render(
      <>
        <TenantPublicEnvBootstrap value={value} />
        <Child />
      </>,
    );

    expect(seen).toEqual(["https://example.supabase.co"]);
    expect((window as WindowWithTenantPublic).__GE_TENANT_PUBLIC__?.anonKey).toBe("anon-public");
  });
});
