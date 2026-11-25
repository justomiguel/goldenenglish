# Billing fee box — exemption does not show the average

## Intent

The monthly fee box strikes the plan price and shows a year average only when a scholarship lowers a month. A month marked exempt stays out of that average. The box keeps the plan price.

## Done when

- `discountedAverageMonthlyFeeFromCells` returns null when every discount is an exemption with no scholarship.
- An exempt month with no scholarship is left out of the average. It does not count as 0.
- A scholarship month still counts. A 100% scholarship month still counts as 0 and still strikes the plan price.
- When scholarships and exemptions share the year, the average uses only the months that are not a plain exemption.
- The fee box on the admin student payments tab is the only surface. Tests lock the three cases above.

## Out of scope

- Month chips, the green "pays per month" total, and the amount stored on the payment row.
- Removing existing scholarships or exemptions in Golden.
- Parent and student payment screens.

## Surfaces (Web vs PWA)

Tier B. The box lives in `AdminBillingSectionFeeSummary`, used by `AdminStudentBillingClient`. No PWA tree reads `discountedAverageMonthlyFeeFromCells`. Desktop only.

## Rule

A plain exemption is `status === "exempt"` and no scholarship percent and no expected amount below the original full month. A 100% scholarship month is exempt in status and has a scholarship percent. That month stays in the average.
