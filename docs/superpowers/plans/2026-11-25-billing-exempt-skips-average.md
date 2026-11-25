# Billing fee box — exemption skips the average

Spec: `docs/superpowers/specs/2026-11-25-billing-exempt-skips-average-design.md`

## Steps

1. Change `discountedAverageMonthlyFeeFromCells` tests. A plain exemption returns null. A 100% scholarship still averages to 0. A mixed year averages only the scholarship months.
2. Update `src/lib/billing/discountedAverageMonthlyFeeFromCells.ts` so a plain exemption is left out.
3. Run `npx vitest run src/__tests__/lib/billing/discountedAverageMonthlyFeeFromCells.test.ts`.
