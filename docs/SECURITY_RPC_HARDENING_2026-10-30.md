# NEXA security improvement — migration 23

**Base reviewed:** `ab1a99ba35f594fd26fb6454077d40dfe7dd6253` (2026-10-30 review).  
**Scope:** SQL SECURITY DEFINER RPCs for gamification and AI credits.  
**Limitations:** source review; migration not applied to live Supabase; no live-auth integration tests performed.

## Why this change matters

The old `grant_points_atomic` function was callable without an explicit server-role check, allowing a direct caller to submit arbitrary positive points and a new idempotency key. `deduct_ai_credits` accepted a negative amount, which mathematically increased credits. The old admin helper relied on `CURRENT_USER` inside a SECURITY DEFINER function, which could reflect the function owner instead of the requester.

## Changes

1. Migration `23_lock_down_points_and_credits_rpc.sql` removes point-grant execute access from PUBLIC/anon/authenticated, requires the service-role JWT, validates positive deltas, and retains ledger idempotency.
2. `deduct_ai_credits` rejects zero/negative amounts and uses null-safe caller comparison; only authenticated and service-role callers can execute it.
3. `is_admin_or_service` no longer trusts SECURITY DEFINER `CURRENT_USER`. Note: its existing email/profile admin checks are retained for compatibility and should be standardized separately.
4. The assessment submission and lesson completion handlers use `createAdminClient()` for the point-grant call after their existing authenticated-user/domain checks. Their other Supabase queries remain user-scoped.

## Required staging validation (do before production)

- Apply migration 23 **after** migrations 21–22. Confirm role grants using PostgreSQL's `has_function_privilege`.
- As an ordinary authenticated user, verify calling `grant_points_atomic` is denied even with self-owned `p_user_id`; repeat for another user ID and for anonymous requests.
- As a service-role server caller, verify exactly one point grant, duplicate idempotency request returns `already_awarded=true`, and points tally matches the ledger.
- With authenticated user JWT, call `deduct_ai_credits` with negative, zero, positive, too-large, and another user's ID: only positive permitted self-deduction should succeed.
- Test a normal learner completing a learning module and passing an assessment. Point grant and ledger must remain functional.
- Test a caller attempting to modify profile role/credits/points with normal Supabase client: must fail.
- Test org A and org B users cannot query protected data via `is_admin_or_service`-guarded policies.
- Verify production has `SUPABASE_SERVICE_ROLE_KEY` configured **only on the server**. Do not expose it in client components or NEXT_PUBLIC environment variables.
- Review the existing legacy helper that accepts `profiles.role='ADMIN'` and its old fixed superadmin email against the canonical server admin policy.

## Important follow-up issues (not fixed in this PR)

- Additional historical RLS policies granting anon demo access should be audited in staging; migration 08 explicitly created broad demo policies.
- User-scoped access to rubric/grades and signed evidence URLs needs multi-user integration tests.
- Payment provider reconciliation requires independent staging verification despite successful CI.
- The submission endpoint performs multiple database writes; consider atomic transaction/idempotency testing.

## Validation status

Static source analysis: completed. GitHub PR CI: check PR checks after creation. SQL staging deployment: **NOT RUN**. Browser E2E: **NOT RUN**. This PR is not a production-security certification.
