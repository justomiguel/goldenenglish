# Tenant Merch Shop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tenant-flagged merch catalog with variants and stock, Flow/MP pickup checkout, guest-to-parent account, and student read-only after assignment.

**Architecture:** In-app module. Domain helpers in `src/lib/shop/`. Tables `shop_products`, `shop_product_variants`, `shop_orders`, `shop_order_items`. Flow refs gain `shop_order_id` and `purpose=merch`. Flag `site_settings.merch_enabled` (default false) gates public `/tienda`, admin sidebar, and portal nav — same idea as `blog_enabled`, plus a settings toggle.

**Tech Stack:** Next.js App Router, Supabase (RLS + service-role finalize RPC), existing Flow/MP gateways, branded email registry, en/es/pt dictionaries.

**Spec:** [`docs/superpowers/specs/2026-09-03-tenant-merch-shop-design.md`](../specs/2026-09-03-tenant-merch-shop-design.md)

## Global Constraints

- Additive migration only (`21-migrations-production-no-data-destruction`).
- Never `GRANT ALL ON ALL TABLES` to anon (`187` warning).
- File ceiling ~250 lines (`03-architecture.mdc`). Split shop lib by function.
- Copy in `en.json` + `es.json` + `pt.json` same shape (`09-i18n-copy.mdc`).
- Do not reuse `payments`, `event_payments`, coupons, or promotions.
- Guest shopper is `parent`. No `shopper` role.
- Price and stock live on the variant. Pickup only. No bank transfer.
- `loadMerchEnabled()` defaults **false** if the key is missing (opposite of blog).
- Guest profile: `first_name` = email local-part or `Invitado`, `last_name` = `Tienda`, `dni_or_passport` = unique `shop:{uuid}`.
- Existing parent email: attach order, do not sign the visitor in, do not reset password.
- Other-role email: reject.
- Stock decrements only in the paid transaction. Cancel does not restock in v1.

---

## File map

**Create**

- `supabase/migrations/207_tenant_merch_shop.sql`
- `src/lib/shop/types.ts`
- `src/lib/shop/parseMerchEnabled.ts`
- `src/lib/shop/shopOrderStatus.ts`
- `src/lib/shop/guestShopperProfile.ts`
- `src/lib/shop/shopLineTotals.ts`
- `src/lib/shop/canAssignShopOrder.ts`
- `src/lib/shop/loadMerchEnabled.ts`
- `src/lib/shop/shopMedia.ts`
- `src/lib/shop/loadPublicCatalog.ts`
- `src/lib/shop/loadShopOrderByPayToken.ts`
- `src/lib/shop/startShopCheckout.ts`
- `src/lib/shop/ensureGuestShopperParent.ts`
- `src/lib/shop/finalizeShopOrderFromFlowGateway.ts`
- `src/lib/shop/finalizeShopOrderFromMercadoPago.ts`
- `src/lib/shop/expireStaleShopOrders.ts`
- `src/lib/shop/notifyShopEmail.ts`
- `src/lib/email/templates/registryShop.ts`
- `src/app/[locale]/dashboard/admin/settings/setMerchEnabled.ts`
- `src/app/[locale]/dashboard/admin/merch/page.tsx`
- `src/app/[locale]/dashboard/admin/merch/actions.ts`
- `src/app/[locale]/dashboard/admin/merch/orders/page.tsx`
- `src/app/[locale]/dashboard/admin/merch/orders/actions.ts`
- `src/app/[locale]/tienda/layout.tsx`
- `src/app/[locale]/tienda/page.tsx`
- `src/app/[locale]/tienda/[productId]/page.tsx`
- `src/app/[locale]/tienda/checkout/page.tsx`
- `src/app/[locale]/tienda/checkout/actions.ts`
- `src/app/[locale]/tienda/pedido/[token]/page.tsx`
- `src/app/[locale]/dashboard/parent/shop/page.tsx`
- `src/app/[locale]/dashboard/parent/shop/orders/page.tsx`
- `src/app/[locale]/dashboard/parent/shop/orders/actions.ts`
- `src/app/[locale]/dashboard/student/shop/orders/page.tsx`
- `src/components/dashboard/MerchSettingsForm.tsx`
- `src/components/dashboard/admin/merch/AdminMerchProductsScreen.tsx`
- `src/components/dashboard/admin/merch/AdminMerchOrdersScreen.tsx`
- `src/components/shop/PublicShopCatalog.tsx`
- `src/components/shop/PublicShopProduct.tsx`
- `src/components/shop/ShopCheckoutForm.tsx`
- `src/components/shop/ShopOrderStatus.tsx`
- Tests under `src/__tests__/lib/shop/`, `src/__tests__/db/tenant_merch_shop_migration.test.ts`, component/action tests beside existing admin/settings suites

**Modify**

- `src/lib/dashboard/buildAdminDailyNavItems.tsx` — `includeMerchNav`, item after events (blog still after events; merch after blog when both on: Events → Blog? → Merch → Institute). **Order when both flags:** Events, Blog (if on), Merch (if on), Institute.
- `src/lib/dashboard/buildAdminInstituteHubGroups.ts` — growth row when `includeMerchNav`
- `src/lib/dashboard/adminSurfaceIcon.tsx` — `merch` icon (`ShoppingBag`)
- `src/lib/dashboard/adminPageHeaderArt.ts` — `merch: "institute"`
- `src/app/[locale]/dashboard/admin/layout.tsx` — load flag, pass `includeMerchNav`
- `src/app/[locale]/dashboard/admin/institute/page.tsx` — pass flag
- `src/app/[locale]/dashboard/admin/settings/page.tsx` — merch card
- `src/app/[locale]/page.tsx` + `LandingHeader.tsx` / landing section props — shop link when enabled
- `src/app/api/payments/flow/confirm/route.ts` — `purpose === "merch"`
- `src/app/api/payments/mercadopago/webhook/route.ts` — same
- `src/lib/portal/portalShellTypes.ts` — `PortalIconName` += `"shop"`
- `src/lib/portal/buildParentShellConfig.ts` / `buildStudentShellConfig.ts` — shop destinations when flag on
- parent/student layouts — load `merch_enabled`
- `src/lib/email/templates/templateRegistry.ts` — spread `SHOP_EMAIL_TEMPLATES`
- `src/dictionaries/{en,es,pt}.json`
- Nav/hub/icon/settings tests that pin exact lists

---

### Task 1: Domain helpers (TDD)

**Files:**
- Create: `src/lib/shop/types.ts`
- Create: `src/lib/shop/parseMerchEnabled.ts`
- Create: `src/lib/shop/shopOrderStatus.ts`
- Create: `src/lib/shop/guestShopperProfile.ts`
- Create: `src/lib/shop/shopLineTotals.ts`
- Create: `src/lib/shop/canAssignShopOrder.ts`
- Test: `src/__tests__/lib/shop/parseMerchEnabled.test.ts`
- Test: `src/__tests__/lib/shop/shopOrderStatus.test.ts`
- Test: `src/__tests__/lib/shop/guestShopperProfile.test.ts`
- Test: `src/__tests__/lib/shop/shopLineTotals.test.ts`
- Test: `src/__tests__/lib/shop/canAssignShopOrder.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `parseMerchEnabled(value: unknown): boolean` (missing → false), `canTransitionShopOrder(from, to)`, `buildGuestShopperProfile(email, id)`, `sumShopLines(lines)`, `canAssignShopOrder({ actorRole, buyerId, actorId, childIds, studentId })`

- [ ] **Step 1: Write failing tests**

```ts
/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { parseMerchEnabled } from "@/lib/shop/parseMerchEnabled";

describe("parseMerchEnabled", () => {
  it("defaults false when missing", () => {
    expect(parseMerchEnabled(undefined)).toBe(false);
    expect(parseMerchEnabled(null)).toBe(false);
  });
  it("reads boolean and string", () => {
    expect(parseMerchEnabled(true)).toBe(true);
    expect(parseMerchEnabled("false")).toBe(false);
    expect(parseMerchEnabled("true")).toBe(true);
  });
});
```

```ts
import { canTransitionShopOrder } from "@/lib/shop/shopOrderStatus";

it("allows pending_payment → paid|expired|cancelled", () => {
  expect(canTransitionShopOrder("pending_payment", "paid")).toBe(true);
  expect(canTransitionShopOrder("pending_payment", "picked_up")).toBe(false);
});
it("allows paid → ready_for_pickup|cancelled", () => {
  expect(canTransitionShopOrder("paid", "ready_for_pickup")).toBe(true);
});
it("allows ready_for_pickup → picked_up|cancelled", () => {
  expect(canTransitionShopOrder("ready_for_pickup", "picked_up")).toBe(true);
});
```

```ts
import { buildGuestShopperProfile } from "@/lib/shop/guestShopperProfile";

it("uses local-part and shop:{uuid} dni", () => {
  const p = buildGuestShopperProfile("Ada.Lovelace@school.cl", "11111111-1111-1111-1111-111111111111");
  expect(p.first_name).toBe("Ada.Lovelace");
  expect(p.last_name).toBe("Tienda");
  expect(p.dni_or_passport).toBe("shop:11111111-1111-1111-1111-111111111111");
  expect(p.role).toBe("parent");
});
it("falls back to Invitado when local-part empty", () => {
  expect(buildGuestShopperProfile("@x.com", "22222222-2222-2222-2222-222222222222").first_name).toBe(
    "Invitado",
  );
});
```

```ts
import { sumShopLines } from "@/lib/shop/shopLineTotals";

it("sums quantity * unitPrice", () => {
  expect(
    sumShopLines([
      { quantity: 2, unitPrice: 1500 },
      { quantity: 1, unitPrice: 500 },
    ]),
  ).toBe(3500);
});
it("rejects non-positive quantity or price", () => {
  expect(() => sumShopLines([{ quantity: 0, unitPrice: 1 }])).toThrow("invalid_line");
});
```

```ts
import { canAssignShopOrder } from "@/lib/shop/canAssignShopOrder";

it("admin may assign any student", () => {
  expect(
    canAssignShopOrder({
      actorRole: "admin",
      buyerId: "b",
      actorId: "a",
      childIds: [],
      studentId: "s",
    }),
  ).toBe(true);
});
it("parent buyer may assign only linked children", () => {
  expect(
    canAssignShopOrder({
      actorRole: "parent",
      buyerId: "p",
      actorId: "p",
      childIds: ["s1"],
      studentId: "s1",
    }),
  ).toBe(true);
  expect(
    canAssignShopOrder({
      actorRole: "parent",
      buyerId: "p",
      actorId: "p",
      childIds: ["s1"],
      studentId: "s2",
    }),
  ).toBe(false);
});
it("student cannot assign", () => {
  expect(
    canAssignShopOrder({
      actorRole: "student",
      buyerId: "p",
      actorId: "s",
      childIds: [],
      studentId: "s",
    }),
  ).toBe(false);
});
```

- [ ] **Step 2: Run tests — expect FAIL** (modules missing)

```bash
npx vitest run src/__tests__/lib/shop/parseMerchEnabled.test.ts src/__tests__/lib/shop/shopOrderStatus.test.ts src/__tests__/lib/shop/guestShopperProfile.test.ts src/__tests__/lib/shop/shopLineTotals.test.ts src/__tests__/lib/shop/canAssignShopOrder.test.ts
```

- [ ] **Step 3: Implement the five modules** so the tests pass. Keep each file under 80 lines. Status transitions exactly as spec. `parseMerchEnabled` must not default true.

- [ ] **Step 4: Re-run the same vitest command — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/shop src/__tests__/lib/shop
git commit -m "$(cat <<'EOF'
feat: add merch shop domain helpers

Pure status, totals, guest profile, and assign rules before any tables.
EOF
)"
```

---

### Task 2: Migration + SQL contract

**Files:**
- Create: `supabase/migrations/207_tenant_merch_shop.sql`
- Test: `src/__tests__/db/tenant_merch_shop_migration.test.ts`

**Interfaces:**
- Produces: tables + `payment_flow_reserve_commerce_ref_merch(uuid)` + `shop_mark_paid_and_decrement_stock(uuid)` + bucket `shop-media`

- [ ] **Step 1: Write the migration test first** (read the SQL file like `family_billing_policy_migration.test.ts`)

```ts
/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("207_tenant_merch_shop.sql", () => {
  const sql = readFileSync(
    resolve(process.cwd(), "supabase/migrations/207_tenant_merch_shop.sql"),
    "utf-8",
  );

  it("is additive and does not grant all to anon", () => {
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_products/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_product_variants/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_orders/);
    expect(sql).toMatch(/CREATE TABLE IF NOT EXISTS public\.shop_order_items/);
    expect(sql).toMatch(/shop_order_id/);
    expect(sql).toMatch(/payment_flow_reserve_commerce_ref_merch/);
    expect(sql).toMatch(/shop_mark_paid_and_decrement_stock/);
    expect(sql).toMatch(/merch_enabled/);
    expect(sql).toMatch(/'false'::jsonb/);
    expect(sql).toMatch(/shop-media/);
    expect(sql).not.toMatch(/GRANT ALL ON ALL TABLES/);
    expect(sql).not.toMatch(/DROP TABLE/);
  });

  it("keeps prior checkout targets in the refs CHECK", () => {
    expect(sql).toMatch(/payment_id IS NOT NULL/);
    expect(sql).toMatch(/registration_id IS NOT NULL/);
    expect(sql).toMatch(/bundle_id IS NOT NULL/);
    expect(sql).toMatch(/shop_order_id IS NOT NULL/);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL** (file missing)

```bash
npx vitest run src/__tests__/db/tenant_merch_shop_migration.test.ts
```

- [ ] **Step 3: Write `207_tenant_merch_shop.sql`**

Follow `194_registration_enrollment_fee_checkout.sql` for the refs CHECK rewrite and RPC. Required pieces:

```sql
BEGIN;

INSERT INTO public.site_settings (key, value)
VALUES ('merch_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP POLICY IF EXISTS site_settings_select_merch_public ON public.site_settings;
CREATE POLICY site_settings_select_merch_public ON public.site_settings
  FOR SELECT TO anon, authenticated
  USING (key = 'merch_enabled');

-- shop_products, shop_product_variants (unique sku, unique (product_id, size, color),
-- stock >= 0, price > 0), shop_orders (status check, pay_token unique),
-- shop_order_items (quantity >= 1, variant ON DELETE RESTRICT).

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_items ENABLE ROW LEVEL SECURITY;

-- Catalog SELECT for anon+authenticated when merch_enabled is true AND product/variant active.
-- Orders: buyer owns; student sees assignee_student_id = auth.uid(); admin via existing staff helper
-- (copy blog_user_is_staff or assert role in profiles).

ALTER TABLE public.payment_flow_checkout_refs
  ADD COLUMN IF NOT EXISTS shop_order_id UUID
    REFERENCES public.shop_orders (id) ON DELETE CASCADE;

ALTER TABLE public.payment_flow_checkout_refs
  DROP CONSTRAINT IF EXISTS payment_flow_checkout_refs_target_chk;

ALTER TABLE public.payment_flow_checkout_refs
  ADD CONSTRAINT payment_flow_checkout_refs_target_chk CHECK (
    payment_id IS NOT NULL
    OR (
      student_id IS NOT NULL
      AND section_id IS NOT NULL
      AND year IS NOT NULL
      AND month IS NOT NULL
    )
    OR bundle_id IS NOT NULL
    OR registration_id IS NOT NULL
    OR shop_order_id IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.payment_flow_reserve_commerce_ref_merch(p_shop_order_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off AS $$
DECLARE
  seq BIGINT;
  ref TEXT;
BEGIN
  IF p_shop_order_id IS NULL THEN
    RAISE EXCEPTION 'invalid_shop_order';
  END IF;
  seq := nextval('public.payment_flow_commerce_serial_seq'::regclass);
  ref := 'MERCH-' || to_char(now() AT TIME ZONE 'utc', 'YYYY') || '-' ||
    LPAD(seq::text, 8, '0');
  INSERT INTO public.payment_flow_checkout_refs (commerce_ref, shop_order_id)
  VALUES (ref, p_shop_order_id);
  RETURN ref;
END;
$$;

REVOKE ALL ON FUNCTION public.payment_flow_reserve_commerce_ref_merch(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.payment_flow_reserve_commerce_ref_merch(UUID) TO service_role;

-- shop_mark_paid_and_decrement_stock(p_order_id):
-- if status = paid then return 'already_paid';
-- if status <> pending_payment then raise;
-- lock items' variants FOR UPDATE;
-- if any stock < quantity then return 'insufficient_stock';
-- decrement; set paid + paid_at; return 'paid'.

INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-media', 'shop-media', true)
ON CONFLICT (id) DO NOTHING;

-- Staff-only upload/delete policies on storage.objects for bucket_id = 'shop-media'
-- (copy blog-media staff policies from 144).

COMMIT;
```

Do not recreate `site_settings_select_public` (blog uses its own key policy; merch does the same).

- [ ] **Step 4: Re-run migration test — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/207_tenant_merch_shop.sql src/__tests__/db/tenant_merch_shop_migration.test.ts
git commit -m "$(cat <<'EOF'
feat: add merch shop tables and Flow merch commerce refs

Flag defaults off. Stock decrement lives in a single paid RPC.
EOF
)"
```

---

### Task 3: Flag, settings toggle, admin nav

**Files:**
- Create: `src/lib/shop/loadMerchEnabled.ts` (wrap `parseMerchEnabled` + `site_settings` read, like `loadBlogEnabled`)
- Create: `src/app/[locale]/dashboard/admin/settings/setMerchEnabled.ts` (clone `setInscriptionsEnabled`, key `merch_enabled`, revalidate `/`, `/tienda`, admin merch)
- Create: `src/components/dashboard/MerchSettingsForm.tsx` (clone `InscriptionsSettingsForm`)
- Modify: settings page, admin layout, institute page, daily nav, hub groups, `adminSurfaceIcon`, `adminPageHeaderArt`
- Modify: `en.json` / `es.json` / `pt.json` — `adminNav.merch`, `tipMerch`, settings merch card copy
- Test: extend `buildAdminDailyNavItems.test.ts`, `buildAdminInstituteHubGroups.test.ts`, `adminSettingsActions.test.ts`

**Interfaces:**
- `buildAdminDailyNavItems` options gain `includeMerchNav?: boolean`
- Daily order with both flags: `.../events`, optional `/cms/blog`, optional `/merch`, `/institute`

- [ ] **Step 1: Fail the nav tests** — add cases:

```ts
it("lists merch after events when includeMerchNav", () => {
  expect(hrefs({ includeMerchNav: true })).toEqual([
    // same as default, but insert `${BASE}/merch` after events
  ]);
});

it("lists blog then merch when both flags", () => {
  expect(hrefs({ includeBlogNav: true, includeMerchNav: true }).slice(-3)).toEqual([
    `${BASE}/cms/blog`,
    `${BASE}/merch`,
    `${BASE}/institute`,
  ]);
});
```

Hub: `rowsFor("growth", { includeMerchNav: true })` contains `${BASE}/merch`.

- [ ] **Step 2: Run those tests — expect FAIL**

```bash
npx vitest run src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts src/__tests__/lib/dashboard/buildAdminInstituteHubGroups.test.ts
```

- [ ] **Step 3: Implement nav + icon `merch` (`ShoppingBag`) + layout `includeMerchNav={merchEnabled && !needsInitialSiteSetup}` + settings form/action + i18n keys in all three dicts**

`loadMerchEnabled`:

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { parseMerchEnabled } from "@/lib/shop/parseMerchEnabled";

export async function loadMerchEnabled(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "merch_enabled")
    .maybeSingle();
  return parseMerchEnabled(data?.value);
}
```

- [ ] **Step 4: Run nav + `adminSettingsActions` + `dictionaries` tests — expect PASS**

```bash
npx vitest run src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts src/__tests__/lib/dashboard/buildAdminInstituteHubGroups.test.ts src/__tests__/app/adminSettingsActions.test.ts src/__tests__/i18n/dictionaries.test.ts
```

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: gate merch admin nav behind merch_enabled

Settings toggle and sidebar item follow the blog flag pattern.
EOF
)"
```

---

### Task 4: Admin product CRUD + media

**Files:**
- Create: `src/lib/shop/shopMedia.ts` — `SHOP_MEDIA_BUCKET = "shop-media"`, `buildShopMediaStoragePath` (copy `blogMedia.ts`)
- Create: admin merch page + `AdminMerchProductsScreen` + `merch/actions.ts` (create/update product, upsert variants, toggle active)
- Create: signed upload route `src/app/api/shop/media-signed-upload/route.ts` (copy blog route, admin-only)
- Test: `src/__tests__/app/adminMerchProductActions.test.ts` — deny non-admin; reject variant with `stock < 0` or `price <= 0`; reject delete when you only have archive

**Interfaces:**
- `createShopProduct(input)` / `upsertShopVariant(input)` return `{ ok: true, id } | { ok: false, code }`
- Variant unique `(product_id, size, color)` surfaced as `code: "duplicate_variant"`

- [ ] **Step 1: Action tests that mock `assertAdmin` + supabase** (follow `adminPromotionsActions.test.ts`)

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run src/__tests__/app/adminMerchProductActions.test.ts
```

- [ ] **Step 3: Implement list/create/edit UI using existing admin table + form atoms. Product starts `active = false`. Require ≥ 1 variant before activate. Do not DELETE variants that appear on `shop_order_items` — set `active = false`.**

- [ ] **Step 4: Re-run action tests + a smoke render of `AdminMerchProductsScreen` — expect PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: admin merch catalog with variants and photos

Staff can publish SKUs; stock and price stay on the variant.
EOF
)"
```

---

### Task 5: Public catalog + order status page

**Files:**
- Create: `loadPublicCatalog.ts`, `loadShopOrderByPayToken.ts`
- Create: `tienda/layout.tsx` (`notFound()` if `!loadMerchEnabled()`)
- Create: catalog, product, `pedido/[token]` pages + presentational components
- Modify: landing header — optional `shopHref` / `shopLabel` beside blog (same omit-when-off pattern)
- Test: `src/__tests__/lib/shop/loadPublicCatalog.test.ts` — filters inactive / zero-stock variants from the *buyable* set; still returns the product with `soldOut: true` if active and all variants stock 0

**Interfaces:**
- `loadPublicCatalog()` → `{ id, title, imageUrl, soldOut }[]`
- `loadShopOrderByPayToken(token)` → public snapshots + status, no buyer email beyond what the token holder already used

- [ ] **Step 1: Catalog filter unit test (pure mapper over rows)** — put mapping in `src/lib/shop/mapPublicCatalog.ts` so the test needs no Supabase

```ts
import { mapPublicCatalog } from "@/lib/shop/mapPublicCatalog";

it("marks sold out when every active variant has stock 0", () => {
  const rows = mapPublicCatalog([
    {
      id: "p",
      title: "Polera",
      image_path: null,
      active: true,
      variants: [{ id: "v", active: true, stock: 0, price: 10, size: "M", color: "Rojo" }],
    },
  ]);
  expect(rows[0]?.soldOut).toBe(true);
});
it("omits inactive products", () => {
  expect(mapPublicCatalog([{ id: "p", title: "X", image_path: null, active: false, variants: [] }])).toEqual(
    [],
  );
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement mapper, loaders, pages. Product page disables buy when selected variant `stock === 0`. Token page uses `ShopOrderStatus`.**

- [ ] **Step 4: Tests PASS. Landing + layout: flag off → `notFound` (component test or layout test).**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: public merch catalog and order status by token

/tienda 404s when merch_enabled is off.
EOF
)"
```

---

### Task 6: Start checkout + guest parent

**Files:**
- Create: `ensureGuestShopperParent.ts`, `startShopCheckout.ts`, `tienda/checkout/actions.ts`, `ShopCheckoutForm.tsx`
- Test: `src/__tests__/lib/shop/ensureGuestShopperParent.test.ts`
- Test: `src/__tests__/lib/shop/startShopCheckout.test.ts`

**Interfaces:**
- `ensureGuestShopperParent({ email })` →
  - `{ kind: "created", profileId, tempPassword }`
  - `{ kind: "existing_parent", profileId }`
  - `{ kind: "wrong_role" }`
- `startShopCheckout({ buyerId, locale, gateway, lines })` → `{ ok, redirectUrl, payToken } | { ok: false, code }`
- Codes: `flag_off`, `empty_cart`, `insufficient_stock`, `inactive_variant`, `no_gateway`, `student_forbidden`

- [ ] **Step 1: Tests**

`ensureGuestShopperParent`:
- no auth user → createUser + profile with `buildGuestShopperProfile`
- profile role parent → `existing_parent`, never `updateUserById` password
- profile role student → `wrong_role`

`startShopCheckout`:
- student buyer id rejected (`student_forbidden`) — pass role into the function
- line stock check uses current variant rows
- inserts `pending_payment` + items with snapshots
- calls `payment_flow_reserve_commerce_ref_merch` only for Flow
- MP external reference `shop_order:{id}`
- neither gateway configured → `no_gateway` (no order insert, or insert then cancel — **prefer no insert**)

- [ ] **Step 2: Run — expect FAIL**

```bash
npx vitest run src/__tests__/lib/shop/ensureGuestShopperParent.test.ts src/__tests__/lib/shop/startShopCheckout.test.ts
```

- [ ] **Step 3: Implement.** Checkout action: if no session, require email, run `ensureGuestShopperParent`, then `startShopCheckout`. If `created`, send `shop.guest_account_created` (Task 8 can no-op the mail helper until then — call `notifyShopEmail` stub that tests mock). Logged-in parent skips email. Logged-in student: `{ code: "student_forbidden" }`.

Copy Flow/MP start from `startEventGatewayPaymentCore` / enrollment start: same credential loaders, `purpose=merch` on confirm/return URLs.

Return URL: `/{locale}/tienda/pedido/{payToken}`.

- [ ] **Step 4: Tests PASS**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: start merch checkout and provision guest parents

Email-only visitors become parents; students cannot pay.
EOF
)"
```

---

### Task 7: Finalize paid + webhooks (idempotent stock)

**Files:**
- Create: `finalizeShopOrderFromFlowGateway.ts`, `finalizeShopOrderFromMercadoPago.ts`
- Modify: Flow confirm + MP webhook `purpose === "merch"`
- Test: `src/__tests__/lib/shop/finalizeShopOrderPaid.test.ts`

**Interfaces:**
- Both finalize functions call `admin.rpc("shop_mark_paid_and_decrement_stock", { p_order_id })`
- Map RPC `already_paid` → `{ ok: true, alreadyPaid: true }` (no second mail)
- Map `insufficient_stock` → `{ ok: false, code: "insufficient_stock" }` (order stays `pending_payment`; log). Admin copy on orders list when this happens: contact family for refund outside the app.
- Map `paid` → send `shop.order_paid`

- [ ] **Step 1: Test the TS wrapper** with a mock RPC:

```ts
it("second finalize is a no-op", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: "already_paid", error: null });
  const r = await markShopOrderPaid({ admin: { rpc }, orderId: "o" });
  expect(r).toEqual({ ok: true, alreadyPaid: true });
});
it("insufficient stock does not throw as success", async () => {
  const rpc = vi.fn().mockResolvedValue({ data: "insufficient_stock", error: null });
  const r = await markShopOrderPaid({ admin: { rpc }, orderId: "o" });
  expect(r).toEqual({ ok: false, code: "insufficient_stock" });
});
```

Put the shared wrapper in `src/lib/shop/markShopOrderPaid.ts` so Flow/MP both use it after they verify the gateway payment is paid.

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement wrapper + Flow/MP finalize (mirror `finalizeEventPaymentFromFlowGateway` token/status fetch, then resolve `shop_order_id` from `payment_flow_checkout_refs` or MP external ref). Wire `purpose === "merch"` in both routes.**

- [ ] **Step 4: Tests PASS. Also add a route-level test or extend existing flow-confirm purpose tests if present.**

- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: finalize merch payments and decrement stock once

Duplicate Flow/MP webhooks do not sell the last unit twice.
EOF
)"
```

---

### Task 8: Emails + expire stale pending

**Files:**
- Create: `src/lib/email/templates/registryShop.ts`
- Modify: `templateRegistry.ts`
- Create: `notifyShopEmail.ts` (`sendBrandedEmail`)
- Create: `expireStaleShopOrders.ts` — `pending_payment` and `created_at < now() - 24h` → `expired`
- Test: registry keys exist via `isKnownEmailTemplateKey`
- Test: `expireStaleShopOrders` only touches pending older than 24h

**Keys (exact):** `shop.guest_account_created`, `shop.order_started`, `shop.order_paid`, `shop.order_ready`

Placeholders: `password`, `signInUrl`, `orderUrl`, `pickupNote` as needed per key.

- [ ] **Step 1: Tests for keys + expire filter (pure date predicate in `isShopOrderExpired(createdAt, now)`)**

- [ ] **Step 2: FAIL, then implement registry + notify + expire. Call `expireStaleShopOrders` from admin order list load and from `loadShopOrderByPayToken`.**

- [ ] **Step 3: PASS + dictionaries still green**

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: merch order emails and 24h pending expiry

Guest password mail is intentional; failed send does not roll back the order.
EOF
)"
```

---

### Task 9: Admin orders + parent assign + student read

**Files:**
- Create: admin orders page/actions (ready / picked_up / cancel / assign)
- Create: parent shop + orders pages; assign action uses `canAssignShopOrder` + `parent_student` child ids
- Create: student orders page (select where `assignee_student_id = auth.uid()`)
- Modify: parent/student shell configs + layouts (`includeShopNav` from `loadMerchEnabled`)
- Test: order transition actions deny illegal status; parent assign rejects non-child; student checkout action still forbidden

**Interfaces:**
- Parent shell: destinations `shop` (`/shop`) and keep orders under `/shop/orders` with `matchPrefixes`
- Student shell: only `/shop/orders` when flag on
- Portal icon `shop` — add to `PortalIconName` and the icon map in `PortalShell` (find the existing switch and add `ShoppingBag`)

- [ ] **Step 1: Extend `buildParentShellConfig` / `buildStudentShellConfig` tests** (create or update) so flag off omits shop, flag on includes it. Fail first.

- [ ] **Step 2: Implement screens. Admin marks `ready_for_pickup` → send `shop.order_ready`. Cancel does not restock.**

- [ ] **Step 3: PASS shell + action tests**

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: merch pickup desk and family order views

Parents assign a paid order to a child; students only read assigned rows.
EOF
)"
```

---

### Task 10: Wire landing + residual tests

**Files:**
- `src/app/[locale]/page.tsx`, `LandingHeader.tsx`, template landings that already take `blogEnabled` — add `merchEnabled` + shop link
- Fix any icon-catalog / tour / smoke tests that enumerate `ADMIN_SURFACE_ICON_IDS` or daily hrefs
- `src/__tests__/i18n/dictionaries.test.ts` and `destructiveActionsCopy.test.ts` must stay green

- [ ] **Step 1: Grep for `includeBlogNav` and `ADMIN_SURFACE_ICON_IDS` tests; update snapshots/lists for `merch`**

```bash
rg -n "includeBlogNav|ADMIN_SURFACE_ICON_IDS|cms/blog" src/__tests__ --glob '*.ts*'
```

- [ ] **Step 2: Landing unit test — header shows shop label only when `merchEnabled`**

- [ ] **Step 3: Run the full related suite**

```bash
npx vitest run src/__tests__/lib/shop src/__tests__/db/tenant_merch_shop_migration.test.ts src/__tests__/lib/dashboard/buildAdminDailyNavItems.test.ts src/__tests__/lib/dashboard/buildAdminInstituteHubGroups.test.ts src/__tests__/i18n/dictionaries.test.ts src/__tests__/app/adminSettingsActions.test.ts src/__tests__/app/adminMerchProductActions.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: show public shop link when merch is enabled

Landing and remaining nav tests follow the blog omit-when-off pattern.
EOF
)"
```

---

## Self-review

**Spec coverage**

| Spec | Task |
|------|------|
| `merch_enabled` default false + settings toggle + nav | 2, 3 |
| Tables, variants, snapshots, `pay_token` | 2, 6 |
| Flow `MERCH-` ref + `purpose=merch` | 2, 6, 7 |
| Stock decrement on paid, idempotent webhook | 2, 7 |
| Guest parent + temp password + wrong-role reject | 1, 6, 8 |
| Existing parent: no login, no password reset | 6 |
| Student never pays | 6, 9 |
| Assign after pay; student read-only | 1, 9 |
| Pickup states + 24h expire | 1, 8, 9 |
| `/tienda` 404 when off | 5 |
| Emails | 8 |
| No coupons, shipping, transfer, new role | respected (not scheduled) |
| i18n en/es/pt | 3, 10 |
| `shop-media` | 2, 4 |

**Placeholders:** none.

**Types:** `includeMerchNav`, status union, guest `kind` union, RPC return strings `paid | already_paid | insufficient_stock` used in Tasks 2 and 7.
