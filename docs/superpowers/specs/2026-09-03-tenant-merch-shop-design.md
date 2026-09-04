# Tenant merch shop (internal catalog, Flow/MP, institute pickup)

**Date:** 2026-09-03
**Status:** Approved (brainstorm)
**Kind:** Design spec. One implementation plan under `docs/superpowers/plans/`.

**Related:**

- Event public pay (`pending_payment` → Flow / MP) — same guest-checkout idea and webhook `purpose` multiplex. Do **not** share `event_payments` or event tables.
- [`2026-08-28-registration-enrollment-fee-checkout-design.md`](2026-08-28-registration-enrollment-fee-checkout-design.md) — `payment_flow_checkout_refs` target CHECK + `purpose` on Flow confirm / MP webhook. This spec adds `shop_order_id` the same way enrollment added `registration_id`.
- Blog flag (`blog_enabled` → `includeBlogNav` + public `/blog` 404) — same on/off pattern. This spec adds `merch_enabled` **and** an admin settings toggle (blog has no toggle today).
- Parent invite / admin user create — account provisioning. Guest merch **does** email a temporary password (explicit exception; other flows prefer a recovery link).
- Coupons (`discount_coupons`) and promotions (`promotions.applies_to` enrollment/monthly/both) — tuition only. Out of this spec.

**Governing rules:** `03-architecture.mdc` (250-line ceiling), `04-security.mdc`, `09-i18n-copy.mdc` (en + es; keep `pt.json` in the same shape), `12-supabase-app-boundaries.mdc`, `21-migrations-production-no-data-destruction.mdc`, `08-analytics-observability.mdc`.

No ADR: checkout refs already map one `commerce_ref` to a target. This adds `shop_order_id`.

## Intent

Each tenant can sell its own merch (uniforms, books, kits) inside this app: a public catalog, parent checkout with the existing Flow / Mercado Pago keys, and pickup at the institute. There is no merchandising module today — the sidebar item does not exist and there are no shop tables. This spec builds a thin in-app shop. It does not adopt Shopify, Medusa, or Saleor.

## Context

Today:

- Admin daily nav is Home, students, parents, teachers, all accounts, registrations, academics, finance, messages, events, optional blog, institute. No shop item.
- `site_settings.blog_enabled` gates blog nav and public `/blog`. There is no `merch_enabled`.
- Flow and Mercado Pago already charge monthly tuition, enrollment, trials/joins, and events. `payment_flow_checkout_refs_target_chk` requires exactly one of `payment_id`, monthly slot, `bundle_id`, or `registration_id`.
- Coupons and promotions apply only to tuition / enrollment.
- Roles are `admin`, `teacher`, `student`, `parent`, `assistant`, `site_contact`. No customer role.
- Public event pay does **not** create an Auth user. Admin create-user and registration accept do.

## Decisions

| Topic | Choice |
|-------|--------|
| Architecture | In-app module. Four tables + Flow ref column. No second commerce engine |
| Flag | `site_settings.merch_enabled`, JSON boolean, **default `false`**. Public shop, nav items, and landing link appear only when true |
| Admin toggle | Settings card to turn the flag on/off (unlike blog) |
| Admin nav | Daily sidebar item **Merchandising** when the flag is on, after Events (same slot as Blog). Also a row in institute hub group `growth` |
| Teacher | No merch nav, no merch admin |
| Public routes | `/{locale}/tienda`, `/{locale}/tienda/[productId]`, `/{locale}/tienda/pedido/[token]`. Layout `notFound()` when flag is off |
| Landing | Header / landing link to `/tienda` when the flag is on (same omission pattern as blog) |
| Parent routes | `/{locale}/dashboard/parent/shop` (catalog + checkout) and `.../shop/orders` |
| Student routes | `/{locale}/dashboard/student/shop/orders` only. No catalog, no pay |
| Who pays | Parent (logged-in) or a public visitor who becomes a `parent`. Student never pays |
| Order owner | `shop_orders.buyer_id`. Student sees the order only after parent or admin sets `assignee_student_id` |
| Guest account | Email only. If no Auth user: create `parent` with `must_change_password`, email a temporary password, create the order as that buyer. If email is already a `parent`: attach the order to that profile, **do not** log the visitor into it, **do not** reset their password. If email is any other role: reject, ask for another email or to sign in |
| Guest return | Opaque `pay_token` on the order (like `registrations.pay_token`). Return URL and “pedido pagado / pendiente” work without a session |
| Products | One product, many variants. Price and stock live on the variant. Product has title, description, photo, `active`, sort order. Copy is a single language (tenant default). UI chrome stays in en/es/pt dicts |
| Variants | Required: at least one per product. Fields: size, color, sku, stock (int ≥ 0), price (numeric > 0). Unique `(product_id, size, color)` |
| Cart | Session / in-memory on the checkout page. Not a persisted cart table |
| Fulfillment | Pickup at the institute only. No shipping address |
| Gateways | Flow and/or Mercado Pago already configured for the tenant. Hide a button if that gateway is not configured. If **neither** is configured, checkout shows contact-the-institute copy and no pay button. **No bank transfer in v1** |
| Currency | Existing billing currency in `site_settings` |
| Stock | Decremented in the same transaction that sets `paid`. Not reserved at checkout start. `expired` / failed pay does not touch stock |
| Idempotency | Repeat webhook / double finalize is a no-op after `paid` |
| Coupons / promotions | Out of v1 |
| New role | Out of v1. Guest shopper is `parent` |
| Media | Bucket `shop-media`. Signed upload, same pattern as `blog-media` |

## Goals

1. Admin can turn merch on, CRUD products and variants, and move orders through pickup states.
2. Public and parent can browse active products and pay with Flow or MP.
3. A public email becomes a `parent` who can later sign in and manage pickup.
4. A student sees only orders assigned to them, read-only.
5. Stock never goes negative; a duplicate webhook does not sell twice.

## Data

### `site_settings`

Insert `merch_enabled` = `false`. Public-read RLS for that key (same as `blog_enabled`). Admin upsert via the existing settings action pattern (`inscriptions_enabled`).

### `shop_products`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `title` | text, required |
| `description` | text, default `''` |
| `image_path` | text nullable, object in `shop-media` |
| `active` | boolean, default false (must activate to sell) |
| `sort_order` | int, default 0 |
| `created_at` / `updated_at` | timestamptz |

### `shop_product_variants`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `product_id` | FK cascade |
| `size` | text, required (admin may type `Único`) |
| `color` | text, required |
| `sku` | text, unique per tenant table (global unique in this deploy) |
| `stock` | int ≥ 0 |
| `price` | numeric > 0 |
| `active` | boolean, default true |

Cannot delete a variant that appears on a `shop_order_items` row; archive with `active = false`.

### `shop_orders`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `buyer_id` | FK `profiles.id`, required, role at create time is `parent` |
| `assignee_student_id` | FK `profiles.id` nullable, role must be `student` when set |
| `status` | see states |
| `currency` | text, snapshot of billing currency |
| `total` | numeric, sum of items |
| `buyer_email` | text snapshot |
| `pay_token` | unique, opaque |
| `gateway_provider` | `flow` \| `mercadopago` \| null |
| `created_at` / `updated_at` | timestamptz |
| `paid_at` / `ready_at` / `picked_up_at` / `expired_at` | timestamptz nullable |

**States (exact):** `pending_payment` → `paid` → `ready_for_pickup` → `picked_up`. Also `expired` and `cancelled`.

Allowed transitions:

- `pending_payment` → `paid` (gateway finalize only)
- `pending_payment` → `expired` (job or start-checkout guard after 24h)
- `pending_payment` → `cancelled` (admin)
- `paid` → `ready_for_pickup` (admin)
- `ready_for_pickup` → `picked_up` (admin)
- `paid` or `ready_for_pickup` → `cancelled` (admin; stock is **not** restocked in v1)

### `shop_order_items`

`order_id`, `variant_id` (ON DELETE RESTRICT), `quantity` ≥ 1, `unit_price` snapshot, `title` / `size` / `color` / `sku` snapshots.

### Flow refs

Add `shop_order_id UUID REFERENCES shop_orders(id) ON DELETE CASCADE` to `payment_flow_checkout_refs`. Extend `payment_flow_checkout_refs_target_chk` with `OR shop_order_id IS NOT NULL`. New RPC `payment_flow_reserve_commerce_ref_merch(p_shop_order_id)` returns `MERCH-{seq}`.

MP / Flow confirm routes gain `purpose=merch` next to `event`, `enrollment`, `trial`, `join`, `monthly`.

### RLS

- Active product + active variant: `SELECT` for `anon` and `authenticated` only when `merch_enabled` is true.
- Orders: buyer selects own rows; student selects rows where `assignee_student_id = auth.uid()`; admin selects all.
- Writes go through server actions / service role. No client insert on orders or stock.

## Checkout flow

1. Buyer selects variant quantities. Server rejects if any variant is inactive, product inactive, `quantity < 1`, or `quantity > stock`.
2. **Logged-in parent:** `buyer_id = auth.uid()`.
3. **Guest:** submit email.
   - No user: `createUser` as `parent`, `email_confirm: true`, `app_metadata.must_change_password`, random temp password, branded mail `shop.guest_account_created` with the password and a sign-in URL. Profile required columns: `first_name` = email local-part (trimmed, fallback `Invitado`), `last_name` = `Tienda`, `dni_or_passport` = unique `shop:{uuid}` (never shown as a real document; UI shows the email). Do not use a real DNI placeholder that could collide with a later import.
   - Existing `parent`: use that `id`. Mail `shop.order_started` to that address. Visitor is not signed in as them.
   - Other role: error, no order.
4. Insert `shop_orders` `pending_payment` + items with snapshots. `total` is computed server-side from current variant prices (then frozen on the items).
5. Start Flow or MP with `purpose=merch` and reserved `MERCH-…` / MP external reference = `shop_order:{id}` (same style as `event_attendee:{id}`).
6. Finalize: if already `paid`, return. Else lock variant rows, verify stock still ≥ quantity, decrement, set `paid` + `paid_at`. If stock lost the race: leave `pending_payment`, do not capture a second time; log; admin handles refund outside the app in v1 (document in admin empty-state copy: “pago ok, stock insuficiente — contactar”).
7. Return URL: `/{locale}/tienda/pedido/{pay_token}`.
8. After 24h still `pending_payment`: set `expired`.

Assignment after pay: parent may set `assignee_student_id` only to a student linked as their child (existing tutor relation). Admin may set any student. Clearing the assignee is allowed (order returns to buyer-only visibility).

## Screens

**Admin**

- `/dashboard/admin/merch` — product list, create, edit variants, activate.
- `/dashboard/admin/merch/orders` — filter by status; assign student; mark ready / picked up / cancel.
- Settings card — `merch_enabled` toggle.

**Public**

- Catalog of `active` products that have at least one active variant with `stock > 0` (sold-out products still list if admin left them active, with “sin stock”).
- Product page: variant picker; disable buy when chosen variant stock is 0.
- Checkout page: line items, email field if anon, gateway buttons.
- Order token page: status, pickup copy, no address form.

**Parent**

- Same catalog (authenticated). Checkout skips email.
- Orders list: status + assign-child control.

**Student**

- Orders assigned to them: product snapshots + status + pickup copy. No pay, no assign.

## Emails

New registry keys (appear in Settings automatically, same as other registry additions):

- `shop.guest_account_created` — temp password + sign-in URL + order link (`/tienda/pedido/{token}`).
- `shop.order_paid` — paid + pickup at institute.
- `shop.order_ready` — admin marked ready (buyer email).
- `shop.order_started` — existing parent, guest typed their email (no password).

Failed send does not roll back the order or the Auth user. Log like other branded mail.

## Out of v1

Shipping, persisted cart, merch coupons, size charts, multi-currency, restock on cancel, teacher merch admin, guest checkout without an account, bank transfer, Medusa/Saleor/Shopify.

## Testing

- Migration: `payment_flow_checkout_refs_target_chk` accepts `shop_order_id` alone; existing monthly / enrollment / bundle refs still validate.
- Stock: two concurrent finalize attempts on last unit → one `paid`, one no-op or pending; stock is 0, never −1.
- Webhook duplicate after `paid` → no second decrement.
- Guest create: new email → `parent` + mail key. Existing parent → no password change. Existing student email → error.
- Flag off → public `notFound`, admin nav omits merch, landing omits shop link.
- Student cannot start checkout (action rejects).
- Parent assign: only linked children; student sees the row only after assign.
- i18n: new dict keys in `en.json`, `es.json`, `pt.json` (parity test).
- Dictionaries / destructive-copy tests stay green.

## Non-goals recap

Do not install ecommerce agent skills as a runtime dependency. Do not add a `shopper` role. Do not reuse `payments` or `event_payments` rows for merch totals.
