# Section move keeps chosen agreements

## Context

A section move marks the origin enrollment `transferred` and inserts a new active enrollment. Payments stay on the origin `section_id`. Scholarships stay on the origin enrollment. Staff need those agreements to follow the student when they say so. A destination month can already exist, and a payment row is money, so the move cannot delete it.

## Decision

One Postgres function, `move_student_section_with_carry`, moves the student and the checked agreements in one transaction. The function calls `academic_admin_section_enroll_commit` after the origin rows are `transferred`. Checked payments change `section_id`. A colliding destination payment gets `superseded_at` first, so the partial unique index can accept the moved row. Checked scholarships move to the new enrollment. A replace sets the destination scholarships `is_active = false`. Learning-task progress stays on the origin enrollment.

## Options considered

Copy every agreement, then delete the origin copies. Rejected. A failed second step would leave two copies, and a payment cannot be deleted.

Move the student first, then copy in a second action. Rejected. The two writes can diverge if the second action fails.

## Consequences

Current payment lists and slot lookups filter `superseded_at IS NULL`. A receipt opened by payment id still loads the superseded row. A later month uses the destination section fee plan. The carried payment keeps its stored amount. Tests cover the planner, the failure sentence, and both entry points. Staff see the change in Novedades del sistema.
