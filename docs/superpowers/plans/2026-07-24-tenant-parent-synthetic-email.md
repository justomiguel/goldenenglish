# Tenant parent synthetic email — Implementation Plan

**Goal:** Parent/tutor Auth synthetics use `parents.<MAIL_TENANT>` instead of hardcoded Golden English.

**Done in this change:** `parentDefaultEmail`, `ensureParentProfileByTutorDni` fail-closed, `buildResetByDniPlan` / `isParentSyntheticEmail`, lookup opacity legacy fallback, ADR, `.env.example`, Vitest.
