# Phase 8C.4 — Deterministic Support Evidence Fault-State Validation

Date: 2026-08-17

Status: Implemented and locally validated

## Purpose

Phase 8C.4 closes the narrow validation-evidence gap identified after Phase 8C.3. The Phase 8C.3 implementation already handled derived-unavailable Relative Moisture Index state, but the committed policy tests did not directly invoke that branch. This slice adds deterministic assertions without changing runtime behavior.

## Scope

- Directly exercise derived-unavailable policy behavior when no usable raw ADC evidence exists.
- Verify neutral derived-unavailable treatment without evidence and cautionary treatment after repeated invalid raw evidence.
- Verify invalid, omitted, and stale policy labels remain separate from environmental-condition currency.
- Preserve the existing cadence, freshness, actionable-age, last-good, bounded-count, capability-authority, and device-reporting rules.

## Boundaries

This slice changes no production query, polling path, history window, SQL, Supabase object or row, firmware, device, capability, assignment, watering behavior, Demo behavior, customer adoption, presentation styling, or runtime application behavior. It does not introduce measurement plausibility ranges or Support runtime/configuration mismatch diagnostics.

No sensor is disconnected or faulted. Fault-state validation remains deterministic.

## Acceptance criteria

- Derived-unavailable RMI behavior is directly deterministic-test-covered.
- Approved invalid, omission, stale, future-timestamp, repeated-failure, device-inactive, bounded-count, and capability-driven health behavior remains passing.
- Tests, ESLint, the TypeScript/Vite production build, and `git diff --check` pass.
- Query and Disk IO behavior remain unchanged.
- Phase 8C.3 production validation and operational closeout remain a separate approval.

## Validation result

Validation passed 22/22 deterministic tests, ESLint, the TypeScript/Vite production build, and `git diff --check`. The existing Vite large-chunk advisory remained non-blocking. No production validation, deployment command, SQL, Supabase mutation, firmware or device operation, sensor fault, commit, or push occurred.
